# 빡곰 영상 프로덕션 워크플로우

영상 제작 요청 시 이 파일을 참조하여 자동으로 프로세스를 따른다.

---

## 도구 현황 (2026-03-07)

### 보유 도구
| 도구 | 용도 | 비고 |
|------|------|------|
| Google Flow | 영상(Veo 3.1) + 이미지(Nano Banana) | 토큰 일부 충전 |
| Hailuo AI Free | I2V 영상 생성 (2.3-Fast) | 155 크레딧, 768p 6초 |
| CapCut | 편집 + 효과음 | 사용자가 직접 조작 |
| MCP Gemini | 이미지 생성 (Claude 연동) | API 키 보유 |
| Playwright | 브라우저 자동화 | Hailuo 자동 업로드/다운로드 |

### 도입 예정 (무료)
| 도구 | 용도 | 무료 한도 |
|------|------|----------|
| Kling AI | I2V 영상 생성 | 매일 66크레딧 리셋 |
| suno | AI 배경음악 생성 | 50크레딧/일 (~10곡) |
| ElevenLabs | TTS 캐릭터 음성 | 10,000자/월 (~15분) |
| Higgsfield | I2V 영상 생성 | 1영상+1이미지 (테스트) |
| Freesound | 효과음 라이브러리 | 무제한 무료 |

---

## 제작 프로세스

### Step 1: 기획 + 스크립트
- 장면별 행동/대사/감정 설계
- `character-profile.md`에서 Core Description 복사
- `environments/environment-profiles.md`에서 해당 환경 구역 프롬프트 복사
- 제목은 콘텐츠 전략(`content-strategy.md`) 참조

### Step 2: 시작 이미지 생성
- MCP Gemini (`mcp__mcp-image__generate_image`) 사용
- 필수 파라미터:
  - `maintainCharacterConsistency: true`
  - `inputImagePath`: `reference/빡곰 캐릭터 카드.png`
- 프롬프트 구조: `[Core Description] + [행동] + [환경 구역 프롬프트] + [카메라/조명]`
- 조명 주의: "slightly dim warm lighting, controlled exposure" (과노출 방지)
- 저장: `production/[NNN]_[주제명]/` 폴더

### Step 3: I2V 영상 생성 (멀티 도구 양산)
**핵심 원칙: 같은 시작 이미지로 여러 도구에서 생성 → best pick 선별**

사용 순서 (우선순위):
1. **Hailuo AI** — Playwright 자동화로 업로드/프롬프트/다운로드
2. **Google Flow** — 사용자가 직접 (Veo 3.1)
3. **Kling AI** — 사용자가 직접 (매일 66크레딧)
4. **Higgsfield** — 테스트용

프롬프트 작성 규칙:
- 슬로우모션 방지: "quick snappy movements, real-time speed, not slow motion"
- 카메라 응시 방지: "eyes fixed on [대상], never looks at the camera"
- 물체 합체 방지: 복잡한 소품 상호작용은 최소화
- 한 장면에 행동 2~3개 이내 (과도한 동작 금지)

양산 목표:
- 장면당 최소 3개 후보 생성
- 각 후보에서 자연스러운 2~3초 구간만 선별
- Hailuo는 같은 프롬프트로 2~3회 재생성 가능 (15크레딧/회)

### Step 4: 편집 (CapCut) — 사용자 직접
- best pick 클립들 조합
- 6초 클립에서 핵심 2~3초만 추출
- 자막 대사 추가 (빡곰이 직접 말하는 형태)
- 전환 효과

### Step 5: 음향 — 사용자 직접
- suno → 배경음악 생성 (장면 분위기에 맞춤)
- ElevenLabs → 빡곰 TTS 음성 (선택)
- CapCut / Freesound → 효과음 (재채기, 문소리, 발걸음 등)
- 음향이 영상 품질의 50% — 절대 스킵하지 않는다

### Step 6: 최종 출력
- 풀버전: 44초 ~ 1분 10초 (1분 내외 목표)
- Shorts: 풀버전에서 핵심 장면 편집 (15~30초)
- 이중 업로드: 풀버전 + Shorts 동시 업로드

---

## 파일 구조 규칙

```
production/
├── 001_재채기/
│   ├── bbakgom-sneeze-A-before.png    (시작 프레임)
│   ├── bbakgom-sneeze-video-v1.mp4    (Hailuo 결과물)
│   ├── bbakgom-sneeze-video-v2.mp4
│   ├── bbakgom-sneeze-video-v3.mp4
│   └── (best-pick 클립은 사용자가 CapCut에서 편집)
├── 002_[다음주제]/
│   └── ...
```

- 넘버링: 001부터 순차
- 폴더명: `[NNN]_[주제 한글]`
- 시작 이미지: `bbakgom-[주제]-[설명].png`
- 영상: `bbakgom-[주제]-video-v[N].mp4`
- 최종본은 사용자가 CapCut에서 편집 후 별도 관리

---

## AI 자동화 범위

| 작업 | AI(Claude) | 사용자 |
|------|-----------|--------|
| 기획/스크립트 | O | 검토 |
| 시작 이미지 생성 | O (MCP Gemini) | - |
| Hailuo 영상 생성 | O (Playwright 자동화) | - |
| Flow/Kling/Higgsfield 영상 생성 | - | O (직접) |
| best pick 선별 | 제안 가능 | 최종 결정 |
| CapCut 편집 | - | O (직접) |
| suno 배경음악 | - | O (직접) |
| ElevenLabs TTS | - | O (직접) |
| 효과음 추가 | - | O (직접) |
| YouTube 업로드 | 자동화 가능 | 승인 |
