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
 * Instagram 검색 Cloud Function — 로그인 기반 크롤링
 *
 * Instagram에 로그인한 상태로 해시태그/키워드 검색 후 이미지 크롤링.
 * 로그인 쿠키는 Firebase Realtime DB(crawl-cookies/instagram)에 저장.
 * 검색 결과는 24시간 캐싱.
 *
 * 엔드포인트: GET /searchInstagram?q=검색어&limit=30
 */
exports.searchInstagram = functions
  .runWith({
    memory: "2GB",
    timeoutSeconds: 120,
    maxInstances: 3,
  })
  .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }

    const query = (req.query.q || "").trim();
    if (!query) {
      res.status(400).json({ error: "검색어(q)를 입력해주세요" });
      return;
    }
    const limit = Math.min(parseInt(req.query.limit) || 30, 50);

    // ── 캐시 확인 (24시간 유효) ──
    const cacheKey = `ig_${query.toLowerCase().replace(/[^a-z0-9가-힣]/g, "_").substring(0, 100)}`;
    const cacheRef = db.ref(`instagram-cache/${cacheKey}`);

    try {
      const cached = await cacheRef.once("value");
      const cacheData = cached.val();
      if (cacheData && cacheData.timestamp) {
        const ageHours = (Date.now() - cacheData.timestamp) / (1000 * 60 * 60);
        if (ageHours < 24) {
          res.json({ query, count: cacheData.posts.length, posts: cacheData.posts.slice(0, limit), cached: true });
          return;
        }
      }
    } catch (e) { console.warn("Instagram 캐시 조회 실패:", e.message); }

    // ── 저장된 쿠키 로드 ──
    let savedCookies = null;
    try {
      const cookieSnap = await db.ref("crawl-cookies/instagram").once("value");
      savedCookies = cookieSnap.val();
    } catch (e) { console.warn("Instagram 쿠키 로드 실패:", e.message); }

    let browser = null;
    try {
      const chromium = require("@sparticuz/chromium");
      browser = await require("puppeteer-core").launch({
        args: [...chromium.args, "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
        defaultViewport: { width: 1280, height: 900 },
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

      const page = await browser.newPage();

      // 불필요한 리소스 차단 (속도 향상)
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const type = request.resourceType();
        if (["font", "media", "stylesheet"].includes(type)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // 저장된 쿠키 적용 (로그인 상태 복원)
      if (savedCookies && Array.isArray(savedCookies)) {
        await page.setCookie(...savedCookies);
        console.log("Instagram 쿠키 복원 완료");
      }

      // Instagram 해시태그 검색 페이지 이동
      // 해시태그에서 공백/특수문자 제거
      const hashtag = query.replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase();
      const searchUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag)}/`;
      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 45000 });

      // 로그인 확인 (로그인 페이지로 리다이렉트됐는지 체크)
      const currentUrl = page.url();
      if (currentUrl.includes('/accounts/login')) {
        console.warn("Instagram 로그인 필요 — 쿠키가 만료되었거나 미설정");
        res.status(401).json({
          error: "Instagram 로그인이 필요합니다",
          detail: "쿠키가 만료되었습니다. 재로그인이 필요합니다.",
          needLogin: true
        });
        return;
      }

      // 이미지 로딩 대기
      await page.waitForSelector('article img, main img', { timeout: 15000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 2000));

      // 스크롤하여 더 많은 게시물 로드
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
        await new Promise((r) => setTimeout(r, 1500));
      }

      // ── 게시물 이미지 추출 ──
      const posts = await page.evaluate(() => {
        const results = [];
        const seen = new Set();

        // article 내부의 이미지 또는 메인 영역의 이미지 추출
        document.querySelectorAll('article img, main a[href*="/p/"] img').forEach((img) => {
          const src = img.src;
          if (!src || src.includes('profile') || src.includes('150x150') || seen.has(src)) return;
          seen.add(src);

          // 게시물 링크 찾기
          const linkEl = img.closest('a[href*="/p/"]') || img.closest('a');
          const postUrl = linkEl ? `https://www.instagram.com${linkEl.getAttribute('href')}` : '';

          results.push({
            imageUrl: src,
            thumbUrl: src,
            postUrl: postUrl,
            caption: img.alt || '',
            width: img.naturalWidth || 1080,
            height: img.naturalHeight || 1080,
          });
        });

        return results;
      });

      // 캐시 저장
      if (posts.length > 0) {
        try {
          await cacheRef.set({ query, timestamp: Date.now(), posts: posts.slice(0, 50) });
        } catch (e) { console.warn("Instagram 캐시 저장 실패:", e.message); }
      }

      res.json({ query, count: posts.length, posts: posts.slice(0, limit), cached: false });
    } catch (error) {
      console.error("Instagram 검색 실패:", error.message);
      res.status(500).json({ error: "Instagram 검색 중 오류 발생", detail: error.message });
    } finally {
      if (browser) { try { await browser.close(); } catch (e) {} }
    }
  });

/**
 * Meta 광고 라이브러리 검색 Cloud Function (v2 — 전면 개선)
 *
 * facebook.com/ads/library에서 한국(KR) 대상 활성 광고 소재를 크롤링.
 * URL에 검색어를 직접 포함하여 카테고리 선택 UI를 우회.
 * 이미지(scontent CDN) + 동영상 썸네일을 추출.
 * 검색 결과는 24시간 캐싱.
 *
 * 엔드포인트: GET /searchMetaAds?q=검색어&limit=30
 */
exports.searchMetaAds = functions
  .runWith({
    memory: "2GB",
    timeoutSeconds: 120,
    maxInstances: 3,
  })
  .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }

    const query = (req.query.q || "").trim();
    if (!query) {
      res.status(400).json({ error: "검색어(q)를 입력해주세요" });
      return;
    }
    const limit = Math.min(parseInt(req.query.limit) || 30, 50);

    // ── 캐시 확인 (24시간 유효) ──
    const cacheKey = `meta_${query.toLowerCase().replace(/[^a-z0-9가-힣]/g, "_").substring(0, 100)}`;
    const cacheRef = db.ref(`meta-ads-cache/${cacheKey}`);

    try {
      const cached = await cacheRef.once("value");
      const cacheData = cached.val();
      if (cacheData && cacheData.timestamp) {
        const ageHours = (Date.now() - cacheData.timestamp) / (1000 * 60 * 60);
        if (ageHours < 24) {
          res.json({ query, count: cacheData.ads.length, ads: cacheData.ads.slice(0, limit), cached: true });
          return;
        }
      }
    } catch (e) { console.warn("Meta Ads 캐시 조회 실패:", e.message); }

    let browser = null;
    try {
      const chromium = require("@sparticuz/chromium");
      browser = await require("puppeteer-core").launch({
        args: [...chromium.args, "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
        defaultViewport: { width: 1280, height: 1200 },
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

      const page = await browser.newPage();

      // 동영상 로딩 차단 (속도 향상)
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const type = request.resourceType();
        const url = request.url();
        // 동영상, 폰트 차단 / 이미지·스크립트·CSS는 허용
        if (type === "media" || type === "font" || url.includes('.mp4') || url.includes('.webm')) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
      );

      // Meta Ad Library — 한국 활성 광고, 키워드 검색, 모든 미디어 타입
      const adLibUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=KR&q=${encodeURIComponent(query)}&search_type=keyword_unordered&media_type=all`;
      await page.goto(adLibUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

      // 광고 카드 로딩 대기 — Facebook의 동적 렌더링
      await new Promise((r) => setTimeout(r, 5000));

      // "결과 ~N개" 텍스트가 나타날 때까지 추가 대기 (최대 15초)
      await page.waitForFunction(
        () => document.body.innerText.includes('결과') || document.querySelectorAll('img[src*="scontent"]').length > 0,
        { timeout: 15000 }
      ).catch(() => console.warn("Meta Ads: 결과 텍스트 미감지 — 계속 진행"));

      // 스크롤하여 더 많은 광고 카드 로드
      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
        await new Promise((r) => setTimeout(r, 2000));
      }

      // ── 광고 소재 이미지 추출 (v2 — 정밀 셀렉터) ──
      const ads = await page.evaluate(() => {
        const results = [];
        const seen = new Set();

        // scontent CDN 이미지만 타겟 (광고 소재 이미지)
        document.querySelectorAll('img[src*="scontent"]').forEach((img) => {
          const src = img.src;
          if (!src || seen.has(src)) return;

          // 프로필 이미지 제외 (40x40, 36x36 등 작은 원형 이미지)
          const rect = img.getBoundingClientRect();
          if (rect.width < 80 || rect.height < 80) return;

          seen.add(src);

          // 광고주 이름 — 가장 가까운 광고 카드에서 추출
          let pageName = '';
          let adText = '';
          // 광고 카드 영역 탐색 (Facebook Ad Library의 카드 구조)
          let card = img.parentElement;
          for (let depth = 0; depth < 15 && card; depth++) {
            // "활성" 배지가 있는 요소가 카드 루트
            if (card.innerText && card.innerText.includes('라이브러리 ID:')) {
              // 광고주 이름: "광고" 라벨 바로 위의 텍스트
              const spans = card.querySelectorAll('span');
              for (const span of spans) {
                if (span.textContent === '광고' && span.previousElementSibling) {
                  pageName = span.previousElementSibling.textContent || '';
                  break;
                }
              }
              // 광고주 이름 대안: strong 또는 링크
              if (!pageName) {
                const strong = card.querySelector('strong, a[role="link"] span');
                if (strong) pageName = strong.textContent || '';
              }
              // 광고 텍스트 (광고주 이름 아래의 본문)
              const textEls = card.querySelectorAll('div[style*="webkit-line-clamp"], div[dir="auto"]');
              for (const el of textEls) {
                const t = el.textContent || '';
                if (t.length > 20 && t.length < 500) { adText = t.substring(0, 200); break; }
              }
              break;
            }
            card = card.parentElement;
          }

          results.push({
            imageUrl: src,
            thumbUrl: src,
            adUrl: '',
            pageName: pageName.substring(0, 100),
            title: adText || pageName || img.alt || '',
            width: img.naturalWidth || Math.round(rect.width),
            height: img.naturalHeight || Math.round(rect.height),
          });
        });

        // 동영상 썸네일도 추출 (video 포스터 이미지)
        document.querySelectorAll('video[poster]').forEach((video) => {
          const src = video.poster;
          if (!src || seen.has(src)) return;
          seen.add(src);
          results.push({
            imageUrl: src,
            thumbUrl: src,
            adUrl: '',
            pageName: '',
            title: '동영상 광고',
            width: video.videoWidth || 1080,
            height: video.videoHeight || 1080,
          });
        });

        return results;
      });

      // 캐시 저장
      if (ads.length > 0) {
        try {
          await cacheRef.set({ query, timestamp: Date.now(), ads: ads.slice(0, 50) });
        } catch (e) { console.warn("Meta Ads 캐시 저장 실패:", e.message); }
      }

      res.json({ query, count: ads.length, ads: ads.slice(0, limit), cached: false });
    } catch (error) {
      console.error("Meta Ads 검색 실패:", error.message);
      res.status(500).json({ error: "Meta 광고 라이브러리 검색 중 오류 발생", detail: error.message });
    } finally {
      if (browser) { try { await browser.close(); } catch (e) {} }
    }
  });

/**
 * Google Ads Transparency Center 검색 Cloud Function
 *
 * adstransparency.google.com에서 한국 대상 광고 소재를 크롤링.
 * Google Ads Transparency Center의 내부 RPC API를 직접 호출하여 광고 소재 수집.
 * Puppeteer 없이 순수 HTTP 호출로 동작 (OOM 방지).
 *
 * 흐름:
 * 1. SearchSuggestions API로 키워드 매칭 광고주 목록 조회
 * 2. 상위 광고주별 SearchCreatives API로 크리에이티브 목록 조회
 * 3. 각 크리에이티브의 content.js URL을 fetch하여 이미지 URL 추출
 * 4. 결과를 24시간 캐싱 후 반환
 *
 * 엔드포인트: GET /searchGoogleAds?q=검색어&limit=30
 */
exports.searchGoogleAds = functions
  .runWith({
    memory: "512MB",           // Puppeteer 불필요 → 메모리 대폭 절감
    timeoutSeconds: 60,
    maxInstances: 5,
  })
  .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }

    const query = (req.query.q || "").trim();
    if (!query) {
      res.status(400).json({ error: "검색어(q)를 입력해주세요" });
      return;
    }
    const limit = Math.min(parseInt(req.query.limit) || 30, 50);

    // ── 캐시 확인 (24시간 유효) ──
    const cacheKey = `gads_${query.toLowerCase().replace(/[^a-z0-9가-힣]/g, "_").substring(0, 100)}`;
    const cacheRef = db.ref(`google-ads-cache/${cacheKey}`);

    try {
      const cached = await cacheRef.once("value");
      const cacheData = cached.val();
      if (cacheData && cacheData.timestamp) {
        const ageHours = (Date.now() - cacheData.timestamp) / (1000 * 60 * 60);
        if (ageHours < 24) {
          res.json({ query, count: cacheData.ads.length, ads: cacheData.ads.slice(0, limit), cached: true });
          return;
        }
      }
    } catch (e) { console.warn("Google Ads 캐시 조회 실패:", e.message); }

    // ── node-fetch 또는 내장 fetch 사용 ──
    const fetch = require("node-fetch");
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
    const API_BASE = "https://adstransparency.google.com/anji/_/rpc/SearchService";

    try {
      // ── 1단계: SearchSuggestions — 키워드로 광고주 찾기 ──
      const suggestBody = JSON.stringify({
        "1": query,     // 검색 키워드
        "2": 10,        // 광고주 제안 수
        "3": 10,        // 웹사이트 제안 수
        "4": [2410],    // 한국 지역 코드
        "5": { "1": 1 } // 모든 주제
      });

      const suggestRes = await fetch(`${API_BASE}/SearchSuggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
        body: `f.req=${encodeURIComponent(suggestBody)}`,
      });
      const suggestData = await suggestRes.json();

      // 광고주 목록 추출 — 광고 수 기준 내림차순 정렬 (최대 5명)
      const suggestions = (suggestData["1"] || []).filter((s) => s["1"]);
      const advertisers = suggestions.map((s) => {
        // 광고 수: s["1"]["4"]["2"]["2"] (최대치) 또는 s["1"]["4"]["2"]["1"] (최소치)
        const countObj = ((s["1"]["4"] || {})["2"]) || {};
        const adCount = parseInt(countObj["2"] || countObj["1"] || "0");
        return { name: s["1"]["1"] || "", id: s["1"]["2"] || "", country: s["1"]["3"] || "", adCount };
      }).sort((a, b) => b.adCount - a.adCount).slice(0, 5);

      if (advertisers.length === 0) {
        res.json({ query, count: 0, ads: [], cached: false, note: "매칭되는 광고주 없음" });
        return;
      }

      // ── 2단계: SearchCreatives — 각 광고주의 크리에이티브 조회 ──
      const allAds = [];
      const seenImages = new Set();
      const creativesPerAdvertiser = Math.ceil(limit / advertisers.length);

      for (const advertiser of advertisers) {
        const creativesBody = JSON.stringify({
          "2": Math.min(creativesPerAdvertiser + 5, 40),
          "3": {
            "8": [2410],          // 한국 지역
            "12": { "1": "", "2": true },
            "13": { "1": [advertiser.id] }
          },
          "7": { "1": 1, "2": 30, "3": 2410 }
        });

        const creativesRes = await fetch(`${API_BASE}/SearchCreatives`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
          body: `f.req=${encodeURIComponent(creativesBody)}`,
        });
        const creativesData = await creativesRes.json();
        const creatives = creativesData["1"] || [];

        // ── 3단계: 각 크리에이티브의 content.js에서 이미지 URL 추출 ──
        // 병렬 처리 (최대 5개씩)
        const contentPromises = creatives.slice(0, creativesPerAdvertiser).map(async (creative) => {
          const contentUrl = (creative["3"] || {})["1"] || {};
          let url = contentUrl["4"] || "";
          if (!url) return null;

          // htmlParentId와 responseCallback을 고정값으로 교체
          url = url.replace(/htmlParentId=[^&]+/, "htmlParentId=server")
                   .replace(/responseCallback=[^&]+/, "responseCallback=cb");

          try {
            const contentRes = await fetch(url, {
              headers: { "User-Agent": UA },
              timeout: 8000,
            });
            if (!contentRes.ok) return null;
            const jsContent = await contentRes.text();

            // 이미지 URL 추출 (YouTube 썸네일, 기타 이미지)
            const imgMatches = jsContent.match(/https?:\/\/[^\s"'\\,)(]+?\.(jpg|jpeg|png|webp|gif)/gi) || [];
            const ytMatches = jsContent.match(/https?:\/\/i[0-9]*\.ytimg\.com\/vi\/[^\s"'\\,)(]+/gi) || [];
            const allImgUrls = [...new Set([...ytMatches, ...imgMatches])];

            // 유용한 이미지만 필터 (내부 아이콘 제외)
            const useful = allImgUrls.filter((u) =>
              !u.includes("abg") && !u.includes("adchoices") &&
              !u.includes("mtad") && !u.includes("googlelogo") &&
              !u.includes("pagead/images")
            );

            // 광고 랜딩 URL 추출 (google 도메인 제외)
            const urlMatches = jsContent.match(/https?:\/\/[^\s"'\\,)(]+/gi) || [];
            const landingUrls = urlMatches.filter((u) =>
              !u.includes("google") && !u.includes("gstatic") &&
              !u.includes("cdn.amp") && !u.includes("github") &&
              !u.includes("ytimg")
            );

            return { images: useful, landing: landingUrls[0] || "" };
          } catch (e) {
            return null;
          }
        });

        const contentResults = await Promise.all(contentPromises);

        // 결과 조합
        creatives.slice(0, creativesPerAdvertiser).forEach((creative, idx) => {
          const extracted = contentResults[idx];
          if (!extracted || extracted.images.length === 0) return;

          const imageUrl = extracted.images[0];
          if (seenImages.has(imageUrl)) return;
          seenImages.add(imageUrl);

          // 광고주 페이지 URL 생성
          const adPageUrl = `https://adstransparency.google.com/advertiser/${advertiser.id}?region=KR`;

          allAds.push({
            imageUrl: imageUrl,
            thumbUrl: imageUrl,
            adUrl: extracted.landing || adPageUrl,
            sourceUrl: adPageUrl,
            advertiser: advertiser.name,
            title: `${advertiser.name} 광고`,
            width: imageUrl.includes("ytimg") ? 480 : 300,
            height: imageUrl.includes("ytimg") ? 360 : 250,
          });
        });
      }

      // ── 캐시 저장 ──
      if (allAds.length > 0) {
        try {
          await cacheRef.set({ query, timestamp: Date.now(), ads: allAds.slice(0, 50) });
        } catch (e) { console.warn("Google Ads 캐시 저장 실패:", e.message); }
      }

      res.json({ query, count: allAds.length, ads: allAds.slice(0, limit), cached: false });
    } catch (error) {
      console.error("Google Ads 검색 실패:", error.message);
      res.status(500).json({ error: "Google 광고 투명성 센터 검색 중 오류 발생", detail: error.message });
    }
  });

/**
 * 로그인 쿠키 저장 Cloud Function
 *
 * Playwright/Puppeteer로 로그인한 후 추출한 쿠키를 Firebase에 저장.
 * Pikbox 설정에서 호출하거나, Claude 세션에서 직접 호출.
 *
 * 엔드포인트: POST /saveCrawlCookies
 * Body: { platform: "instagram"|"facebook"|"pinterest", cookies: [...] }
 */
exports.saveCrawlCookies = functions
  .runWith({ memory: "256MB", timeoutSeconds: 10 })
  .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }

    if (req.method !== "POST") {
      res.status(405).json({ error: "POST만 허용" });
      return;
    }

    const { platform, cookies } = req.body;
    if (!platform || !cookies || !Array.isArray(cookies)) {
      res.status(400).json({ error: "platform과 cookies 배열이 필요합니다" });
      return;
    }

    const allowedPlatforms = ["instagram", "facebook", "pinterest"];
    if (!allowedPlatforms.includes(platform)) {
      res.status(400).json({ error: `허용된 플랫폼: ${allowedPlatforms.join(", ")}` });
      return;
    }

    try {
      await db.ref(`crawl-cookies/${platform}`).set(cookies);
      console.log(`${platform} 쿠키 저장 완료: ${cookies.length}개`);
      res.json({ success: true, platform, cookieCount: cookies.length });
    } catch (error) {
      console.error("쿠키 저장 실패:", error.message);
      res.status(500).json({ error: "쿠키 저장 실패", detail: error.message });
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
