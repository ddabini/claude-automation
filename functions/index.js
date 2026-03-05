/**
 * Pikbox — Pinterest 네이티브 검색 프록시
 *
 * Pinterest 검색 결과를 서버사이드에서 가져와 Pikbox에 전달하는 Cloud Function.
 * Puppeteer(헤드리스 브라우저)로 Pinterest 페이지를 렌더링하여 네이티브 검색 품질을 제공.
 * 결과는 Firebase Realtime DB에 24시간 캐싱하여 비용 절감.
 *
 * 엔드포인트: GET /searchPinterest?q=검색어&limit=25
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Firebase 앱 초기화 (Cloud Function 환경에서 자동 인증)
admin.initializeApp();
// 실시간 DB 참조 — 캐시 저장/조회용
const db = admin.database();

/**
 * Pinterest 검색 Cloud Function
 *
 * 흐름:
 * 1. 캐시 확인 (24시간 이내 같은 쿼리 결과 있으면 바로 반환)
 * 2. 캐시 없으면 Puppeteer로 Pinterest 검색 → 핀 데이터 추출
 * 3. 결과를 캐시에 저장 후 반환
 */
exports.searchPinterest = functions
  .runWith({
    memory: "2GB",           // Puppeteer + Chromium에 넉넉한 메모리
    timeoutSeconds: 120,     // Pinterest 로딩에 최대 120초 허용 (cold start 포함)
    maxInstances: 3,         // 동시 실행 제한 (비용 제어)
  })
  .https.onRequest(async (req, res) => {
    // ── CORS 설정 — 모든 출처에서 접근 허용 ──
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    // 브라우저 preflight 요청 처리
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    // ── 파라미터 검증 ──
    const query = (req.query.q || "").trim();
    if (!query) {
      res.status(400).json({ error: "검색어(q)를 입력해주세요" });
      return;
    }

    // 결과 개수 제한 (기본 25, 최대 50)
    const limit = Math.min(parseInt(req.query.limit) || 25, 50);

    // ── 1단계: 캐시 확인 (24시간 유효) ──
    const cacheKey = query
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, "_")
      .substring(0, 100);
    const cacheRef = db.ref(`pinterest-cache/${cacheKey}`);

    try {
      const cached = await cacheRef.once("value");
      const cacheData = cached.val();

      // 캐시가 있고 24시간 이내면 바로 반환
      if (cacheData && cacheData.timestamp) {
        const ageHours = (Date.now() - cacheData.timestamp) / (1000 * 60 * 60);
        if (ageHours < 24) {
          console.log(`캐시 히트: "${query}" (${ageHours.toFixed(1)}시간 전)`);
          res.json({
            query,
            count: cacheData.pins.length,
            pins: cacheData.pins.slice(0, limit),
            cached: true,
            cacheAge: `${ageHours.toFixed(1)}시간`,
          });
          return;
        }
      }
    } catch (cacheErr) {
      // 캐시 에러는 무시하고 계속 진행 (Pinterest에서 새로 가져옴)
      console.warn("캐시 조회 실패:", cacheErr.message);
    }

    // ── 2단계: Puppeteer로 Pinterest 검색 ──
    let browser = null;

    try {
      // Chromium 바이너리 로드 (서버리스 환경용 경량 크로미움)
      const chromium = require("@sparticuz/chromium");

      browser = await require("puppeteer-core").launch({
        args: [
          ...chromium.args,
          "--no-sandbox",            // Cloud Function 환경에서 필수
          "--disable-gpu",           // GPU 없는 환경
          "--disable-dev-shm-usage", // 메모리 사용 최적화
        ],
        defaultViewport: { width: 1280, height: 900 },
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

      const page = await browser.newPage();

      // 불필요한 리소스 차단 (속도 대폭 향상)
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const type = request.resourceType();
        const url = request.url();
        // 이미지, 폰트, 미디어, 스타일시트, 추적 스크립트 차단 (DOM 구조만 필요)
        if (
          ["font", "media", "stylesheet"].includes(type) ||
          url.includes("recaptcha") ||
          url.includes("google-analytics") ||
          url.includes("facebook.com/x/") ||
          url.includes("accounts.google.com")
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      // 모바일 User-Agent — Pinterest 모바일 페이지가 더 가볍고 빠르게 로드됨
      await page.setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      );

      // Pinterest 검색 페이지 이동
      const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, {
        waitUntil: "domcontentloaded", // networkidle2보다 훨씬 빠름
        timeout: 45000,
      });

      // 핀 카드가 로드될 때까지 대기 (최대 30초)
      await page.waitForSelector('[role="group"] img, [data-test-id="pin"] img, [role="listitem"] img', {
        timeout: 30000,
      });

      // 핀 이미지가 실제로 렌더링될 시간 추가 대기
      await new Promise((r) => setTimeout(r, 2000));

      // 스크롤하여 더 많은 핀 로드 (1회만 — 속도 우선)
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
      await new Promise((r) => setTimeout(r, 2000));

      // ── 핀 데이터 추출 ──
      const pins = await page.evaluate(() => {
        const results = [];
        const seen = new Set(); // 중복 제거용

        document.querySelectorAll('[role="group"]').forEach((el) => {
          const img = el.querySelector("img");
          const link = el.querySelector('a[href*="/pin/"]');
          if (!img || !link) return;

          // 핀 URL에서 ID 추출
          const pinMatch = link.href.match(/\/pin\/(\d+)/);
          if (!pinMatch) return;

          const pinId = pinMatch[1];
          if (seen.has(pinId)) return; // 중복 핀 건너뛰기
          seen.add(pinId);

          // srcset에서 가장 큰 이미지 URL 추출
          // Pinterest srcset 패턴: 236x(1x), 474x(2x), 736x(3x), originals(4x)
          const srcset = img.srcset || "";
          let imageUrl = img.src; // 기본값: 현재 src (보통 236x)

          if (srcset) {
            const parts = srcset.split(",").map((s) => s.trim());
            // 4x(originals) > 3x(736x) > 2x(474x) 순으로 선택
            const best =
              parts.find((p) => p.includes("4x")) ||
              parts.find((p) => p.includes("3x")) ||
              parts[parts.length - 1];
            if (best) imageUrl = best.split(" ")[0];
          }

          // 236x 썸네일도 별도 저장 (빠른 미리보기용)
          const thumbUrl = img.src || imageUrl.replace(/\/(originals|736x|474x)\//, "/236x/");

          results.push({
            id: pinId,
            pinUrl: `https://www.pinterest.com/pin/${pinId}/`,
            imageUrl: imageUrl,
            thumbUrl: thumbUrl,
            title: img.alt || "",
            source: "pinterest_native",
          });
        });

        return results;
      });

      // ── 3단계: 결과를 캐시에 저장 ──
      if (pins.length > 0) {
        try {
          await cacheRef.set({
            query: query,
            timestamp: Date.now(),
            pins: pins.slice(0, 50), // 최대 50개까지 캐싱
          });
          console.log(`캐시 저장: "${query}" (${pins.length}개 핀)`);
        } catch (saveErr) {
          console.warn("캐시 저장 실패:", saveErr.message);
        }
      }

      // ── 결과 반환 ──
      res.json({
        query,
        count: pins.length,
        pins: pins.slice(0, limit),
        cached: false,
      });
    } catch (error) {
      console.error("Pinterest 검색 실패:", error.message);
      res.status(500).json({
        error: "Pinterest 검색 중 오류 발생",
        detail: error.message,
      });
    } finally {
      // 브라우저 리소스 정리 (메모리 누수 방지)
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.warn("브라우저 종료 실패:", e.message);
        }
      }
    }
  });

/**
 * YouTube Most Replayed 히트맵 Cloud Function
 *
 * YouTube 영상의 "가장 많이 재생된 구간" 데이터를 가져오는 프록시.
 * YouTube 내부 API(youtubei/v1/player)에서 heatMarkers를 추출.
 * CORS 제약으로 클라이언트에서 직접 호출 불가 → Cloud Function으로 우회.
 * 결과는 Firebase Realtime DB에 7일간 캐싱.
 *
 * 엔드포인트: GET /getYoutubeHeatmap?videoId=영상ID
 */
exports.getYoutubeHeatmap = functions
  .runWith({
    memory: "256MB",          // 경량 HTTP 요청만 → 메모리 적게 필요
    timeoutSeconds: 30,
    maxInstances: 5,
  })
  .https.onRequest(async (req, res) => {
    // CORS 허용
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }

    const videoId = (req.query.videoId || "").trim();
    if (!videoId) {
      res.status(400).json({ error: "videoId를 입력해주세요" });
      return;
    }

    // ── 캐시 확인 (7일 유효) ──
    const cacheKey = `yt-heatmap/${videoId}`;
    try {
      const cached = await db.ref(cacheKey).once("value");
      const cacheData = cached.val();
      if (cacheData && cacheData.timestamp) {
        const ageDays = (Date.now() - cacheData.timestamp) / (1000 * 60 * 60 * 24);
        if (ageDays < 7) {
          res.json({ videoId, markers: cacheData.markers, cached: true });
          return;
        }
      }
    } catch (e) {
      console.warn("히트맵 캐시 조회 실패:", e.message);
    }

    try {
      // ── YouTube 내부 API로 히트맵 데이터 요청 ──
      // youtubei/v1/next 엔드포인트: 추천/관련 정보 + 히트맵 데이터 포함
      // (player 엔드포인트에는 히트맵이 없고, next에 macroMarkersListEntity로 존재)
      const response = await fetch("https://www.youtube.com/youtubei/v1/next?prettyPrint=false", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          videoId: videoId,
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20241126.01.00",
              hl: "ko",
              gl: "KR",
            },
          },
        }),
      });

      if (!response.ok) {
        res.status(502).json({ error: "YouTube 응답 실패", status: response.status });
        return;
      }

      const data = await response.json();

      // heatMarkers 추출 — 여러 가능한 경로에서 탐색
      let markers = [];

      // 경로 1: frameworkUpdates → entityBatchUpdate → macroMarkersListEntity
      // next 엔드포인트의 기본 히트맵 경로 (100개 구간 데이터)
      const mutations = data.frameworkUpdates?.entityBatchUpdate?.mutations || [];
      for (const m of mutations) {
        const heatmap = m.payload?.macroMarkersListEntity?.markersList?.markers;
        if (heatmap && heatmap.length > 0) {
          markers = heatmap.map((h) => ({
            startMs: parseInt(h.startMillis || "0", 10),
            durationMs: parseInt(h.durationMillis || "0", 10),
            intensity: parseFloat(h.intensityScoreNormalized || 0),
          }));
          break;
        }
      }

      // 경로 2: playerOverlays → decoratedPlayerBarRenderer → heatMarkers
      // 일부 영상에서 이 경로로 제공되기도 함
      if (markers.length === 0) {
        const overlayMarkers =
          data.playerOverlays?.playerOverlayRenderer?.decoratedPlayerBarRenderer
            ?.decoratedPlayerBarRenderer?.playerBar?.multiMarkersPlayerBarRenderer
            ?.markersMap;
        if (overlayMarkers) {
          for (const entry of overlayMarkers) {
            if (entry.key === "HEATSEEKER" || entry.key === "AUTO_CHAPTERS") {
              const heatMarkers = entry.value?.heatmap?.heatmapRenderer?.heatMarkers;
              if (heatMarkers && heatMarkers.length > 0) {
                markers = heatMarkers.map((h) => ({
                  startMs: parseInt(h.heatMarkerRenderer?.timeRangeStartMillis || "0", 10),
                  durationMs: parseInt(h.heatMarkerRenderer?.markerDurationMillis || "0", 10),
                  intensity: parseFloat(h.heatMarkerRenderer?.heatMarkerIntensityScoreNormalized || 0),
                }));
                break;
              }
            }
          }
        }
      }

      // 캐시 저장 (마커가 있든 없든 저장 — 재요청 방지)
      try {
        await db.ref(cacheKey).set({
          timestamp: Date.now(),
          markers: markers,
        });
      } catch (saveErr) {
        console.warn("히트맵 캐시 저장 실패:", saveErr.message);
      }

      res.json({ videoId, markers, cached: false });
    } catch (error) {
      console.error("YouTube 히트맵 가져오기 실패:", error.message);
      res.status(500).json({ error: "히트맵 데이터 조회 실패", detail: error.message });
    }
  });

/**
 * 캐시 정리 — 7일 이상 된 캐시 자동 삭제
 * 매일 자정(KST)에 자동 실행
 */
exports.cleanPinterestCache = functions.pubsub
  .schedule("0 15 * * *") // UTC 15:00 = KST 00:00
  .timeZone("Asia/Seoul")
  .onRun(async () => {
    const cacheRef = db.ref("pinterest-cache");
    const snapshot = await cacheRef.once("value");
    const data = snapshot.val();

    if (!data) return null;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const deletions = {};

    // 7일 이상 된 캐시 항목 찾기
    Object.keys(data).forEach((key) => {
      if (data[key].timestamp && data[key].timestamp < sevenDaysAgo) {
        deletions[key] = null; // null로 설정하면 Firebase에서 삭제
      }
    });

    const count = Object.keys(deletions).length;
    if (count > 0) {
      await cacheRef.update(deletions);
      console.log(`Pinterest 캐시 정리: ${count}개 항목 삭제`);
    }

    return null;
  });
