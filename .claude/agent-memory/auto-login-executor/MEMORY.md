# auto-login-executor 메모리

## 관련 에이전트 메모리 참조

| 에이전트 | 참조 시점 | 참조 내용 |
|---------|----------|----------|
| strategy-planning | 캡션 생성 시 | 기획 브리프의 컨셉·톤앤매너 참조 |
| design-figma | 디자인→SNS 업로드 시 | 완성된 이미지/HTML 파일 경로 |
| leader | 업로드 전 | 캡션 초안 승인 + 대상 플랫폼 확인 |

## 등록된 계정 목록 (비밀번호는 .env 참조)

| 플랫폼 | 계정 | 용도 | .env 키 |
|--------|------|------|---------|
| 구글 (개인) | gogumiyo4@gmail.com | 개인용 | GOOGLE_EMAIL |
| 구글 (앱스토어) | gogumiyo4@gmail.com | 앱스토어용 (비밀번호 다름) | GOOGLE_APPSTORE_EMAIL |
| 구글 (회사) | dabin@jaepax.ai | 클로드, 각종 사이트 로그인 | GOOGLE_WORK_EMAIL |
| 젠스파크 | 구글 로그인 (개인) | AI 검색 | GENSPARK_LOGIN_METHOD=google |
| Supabase | GitHub 로그인 | DB 관리 | SUPABASE_LOGIN_METHOD=github |
| 카카오 | gogumiyo4@naver.com | 카카오톡·카카오 서비스 | KAKAO_EMAIL |
| 네이버 | gogumiyo4@naver.com | 블로그·각종 네이버 서비스 | NAVER_ID |
| 인스타그램 | ddavi___ | 개인 계정 | INSTAGRAM_ID |
| Pixabay | gogumiyo4@gmail.com (Google 로그인) | 이미지 API | PIXABAY_API_KEY |

## 신규 서비스 가입 우선순위

미가입 서비스에 회원가입이 필요할 경우 아래 순서로 진행:
1. **카카오 간편 회원가입** (KAKAO_EMAIL 사용)
2. **구글로 로그인** (GOOGLE_EMAIL 개인 계정 사용)

## .env 파일 위치
- `/Users/dabin/Library/Mobile Documents/com~apple~CloudDocs/클로드/.env`

## 인스타그램 로그인 플로우 (2026-02-27 확인 / Playwright Chromium 기준)

- 로그인 URL: `https://www.instagram.com/accounts/login/`
- 아이디 입력: `input[name="email"]` (username 아님!)
- 비밀번호: `input[name="pass"]` (password 아님!)
- 로그인 버튼: `[aria-label="로그인"]` .first
- 2FA 확인 버튼: `button:has-text("확인")` .first — **type="button" (submit 아님!)**
- onetap 팝업: 로그인 성공 후 `onetap/?next=` URL → `button:has-text("나중에 하기")` 또는 `a:has-text("나중에 하기")`
- 로그인 완료 판단: URL이 `https://www.instagram.com/` 이면 성공

## 인스타그램 2FA (TOTP) 플로우 (2026-02-27 완료)

- 2FA 화면: `input[name="verificationCode"]` (type=tel)
- 확인 버튼: `button:has-text("확인")` .first — **type은 "button"이며 type="submit" 아님!**
- TOTP 코드 생성: `pyotp.TOTP(TOTP_SECRET).now()`
- 남은 유효시간 5초 미만이면 새 코드 사이클까지 대기 후 입력
- WhatsApp/SMS 화면이 나타날 경우: "다른 방법 시도" → "인증 앱" 선택 후 TOTP 입력

## 인스타그램 게시물 업로드 플로우 v3 (2026-02-27 최종 성공 확인)

**3차 시도에서 최종 성공** (바로이집 풀케어 DID 광고 이미지, @ddavi___ 프로필 게시 확인 완료)

**핵심 성공 전략: 단일 코드블록 실행** — 파일 선택부터 공유, 프로필 검증까지 하나의 browser_run_code에서 처리. 여러 블록으로 분리 시 타이밍 갭 발생하여 실패.

**핵심: "다음" 버튼은 모달 내 DIV 요소 — 마우스 좌표 직접 클릭 필요**

```python
async def click_next(page, step_name):
    btns = await page.evaluate("""() => {
        const d = document.querySelector('[role="dialog"]');
        if (!d) return [];
        for (const el of d.querySelectorAll('*')) {
            const text = (el.innerText || '').trim();
            if (text === '다음' || text === 'Next') {
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0) {
                    return [{x: r.x, y: r.y, w: r.width, h: r.height}];
                }
            }
        }
        return [];
    }""")
    if btns:
        btn = btns[0]
        await page.mouse.click(btn['x'] + btn['w']/2, btn['y'] + btn['h']/2)
        return True
    return False
```

**단계별 모달 aria-label 변화:**
1. `input[type="file"]` 이미지 주입 → 모달: "자르기"
2. `click_next()` 1차 → 모달: "편집"
3. `click_next()` 2차 → 모달: "새 게시물 만들기" (캡션 단계)
4. `div[role="textbox"]` 캡션 입력
5. 공유 버튼도 좌표 클릭:
   ```python
   share_info = await page.evaluate("""() => {
       const d = document.querySelector('[role="dialog"]');
       for (const el of d.querySelectorAll('*')) {
           const t = (el.innerText || '').trim();
           if (t === '공유하기' || t === 'Share') {
               const r = el.getBoundingClientRect();
               if (r.width > 0 && r.height > 0) return [{x:r.x, y:r.y, w:r.width, h:r.height}];
           }
       }
       return [];
   }""")
   ```
6. "게시물이 공유되었습니다." 화면 확인 → 프로필 페이지 이동 → 최신 게시물 확인

## 인스타그램 업로드 주요 주의사항

- **Chrome 프로필 공유 불가**: launch_persistent_context 타임아웃 → Playwright 내장 Chromium 사용
- **"다음" 버튼**: Playwright locator 클릭 불가 (자르기 다이얼로그가 포인터 이벤트 가로채기) → JS 평가 후 마우스 좌표 직접 클릭
- **공유 버튼**: 동일하게 좌표 클릭 방식 사용
- **게시 완료 확인**: "게시물이 공유되었습니다." 스크린샷 or 프로필 페이지 이미지 수 > 0

## 인스타그램 TOTP 설정 현황

- TOTP 시크릿 키: `.env`의 `INSTAGRAM_TOTP_SECRET`
- WhatsApp/SMS 2FA 비활성화 완료 → 인증 앱(TOTP) 전용
- pyotp 라이브러리로 Claude가 직접 생성 가능

## Genspark 로그인 플로우 (2026-02-27 확인 / Chrome 실행파일 기준)

**핵심: Playwright Chromium은 Google OAuth 차단됨 → 반드시 Chrome 실행파일 사용**

```python
browser = await p.chromium.launch(
    executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args=["--disable-features=WebAuthn,WebAuthenticationExtensions,ConditionalMediatedCredentialDiscovery"]
)
```

**로그인 단계별 처리 순서:**
1. Genspark 홈 → "AI 이미지" 클릭 → 로그인 모달 열기
2. "Google로 계속하기" 클릭 → 구글 이메일 입력 화면
3. 이메일 입력 → Enter
4. **패스키 확인 화면** (`/challenge/pk`): `dispatchEvent('click')` 로 "다른 방법 시도" 버튼 클릭
5. **방법 선택 화면** (`/challenge/selection`): JS로 `<LI>` 좌표 추출 후 `page.mouse.click(x, y)` 으로 "비밀번호 입력" 클릭 (dispatchEvent 불가)
6. **비밀번호 입력 화면**: `input[type='password']:not([aria-hidden='true'])` 에 입력
7. Genspark `/ai_image` 로 자동 이동 = 로그인 완료

**이미지 생성 페이지:**
- URL: `https://www.genspark.ai/ai_image`
- **홈 입력창 사용 금지** → 슈퍼 에이전트로 넘어가 "네, 진행해주세요" 확인 필요
- `/ai_image` 페이지의 textarea에 프롬프트 입력 → Enter
- 생성된 이미지: `/api/files/s/[ID]` URL 형식 (1024x1024)
- 다운로드: `page.context.request.get(url)` 사용 (SSL 오류 없음)

**완성된 스크립트:** `/tmp/genspark_v7.py`

## Pixabay 계정 정보 (2026-02-27 확인)

| 항목 | 값 |
|------|-----|
| 계정 | gogumiyo4@gmail.com (Google 로그인) |
| user_id | 27509389 |
| API 키 | `.env`의 `PIXABAY_API_KEY` |
| 로그인 방법 | Google OAuth ("Continue with Google") |

**Pixabay Google OAuth 로그인 플로우 (2026-02-27 성공 확인)**

- Pixabay는 이메일+비밀번호 로그인 불가 (sessionid 발급 안됨) → **Google OAuth 필수**
- "Continue with Google" 버튼: IFRAME 내부 (`L5Fo6c-PQbLGe` 클래스), 좌표 (631, 300) 클릭
- Google 팝업: `context.wait_for_event("page")` + `page.mouse.click(631, 300)` 조합으로 열기
- 팝업 뷰포트: `set_viewport_size({"width": 600, "height": 900})` 필수 (계속 버튼 가시성)
- 계정 선택: `[data-authuser]` 또는 `li` 태그에서 이메일 텍스트로 찾기
- 동의 화면 (`/signin/oauth/id`): 스크롤 후 `button[text='계속']` 클릭
- 팝업 닫힘 = OAuth 완료 → `TargetClosedError` 예외 처리 필수
- Rate limit: `/api/docs/` 과다 방문 시 발생 → 45초+ 대기 후 재시도

**API 키 형식:** `{user_id}-{hex32}` (예: `27509389-50a62cff1493138db37e536ee`)

**완성된 스크립트:** `/tmp/pixabay_scroll_api.py`

## 참조 스크립트
- 완성된 인스타그램 업로드 스크립트: `/tmp/instagram_final_v7.py`
- 완성된 Genspark 이미지 생성 스크립트: `/tmp/genspark_v7.py`
- Pixabay Google OAuth + API 키 추출: `/tmp/pixabay_scroll_api.py`
