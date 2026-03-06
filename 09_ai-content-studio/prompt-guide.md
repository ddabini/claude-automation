# AI 영상 제작 프롬프트 가이드
## 캐릭터 일관성 중심 워크플로우

---

## 목차
1. [워크플로우 개요](#1-워크플로우-개요)
2. [캐릭터 프로필 시트 작성법](#2-캐릭터-프로필-시트-작성법)
3. [나노바나나 이미지 프롬프트 템플릿](#3-나노바나나-이미지-프롬프트-템플릿)
4. [하이루오 영상 프롬프트 템플릿](#4-하이루오-영상-프롬프트-템플릿)
5. [캐릭터 일관성 유지 기법](#5-캐릭터-일관성-유지-기법)
6. [실전 예시](#6-실전-예시)

---

## 1. 워크플로우 개요

### 기존 (비효율)
```
기획 초안 → 제미나이에 프롬프트 요청 → 나노바나나 시도 → 수정 → 재시도 → 하이루오 시도
           (토큰 소모)            (반복 3~5회)                    (프롬프트 재작성)
```

### 개선 (3단계)
```
① 캐릭터 프로필 시트 작성 (1회만, 이후 재사용)
② 기획 초안 + 프로필 → 프롬프트 자동 생성 → 나노바나나 이미지 (1~2회)
③ 완성 이미지 + 영상 프롬프트 → 하이루오 S2V (1회)
```

**핵심 변화:**
- 제미나이에 물어보는 단계 제거 (프롬프트 템플릿으로 대체)
- 캐릭터 프로필 시트를 한 번 만들어두면 모든 장면에서 재사용
- 이미지→영상 전환 시 프롬프트를 자동으로 변환

---

## 2. 캐릭터 프로필 시트 작성법

캐릭터 일관성의 핵심은 **프로필 시트**입니다. 한 번 정의해두면 모든 프롬프트에 붙여쓰면 됩니다.

### 프로필 시트 양식

```
[캐릭터 이름]: ______

── 얼굴 ──
성별/나이대: (예: 여성, 20대 중반)
얼굴형: (예: 갸름한 계란형)
피부톤: (예: 밝은 아이보리)
눈: (예: 큰 갈색 아몬드형 눈, 쌍꺼풀 있음)
코: (예: 작고 오뚝한 코)
입: (예: 도톰한 입술, 자연스러운 핑크색)
이마: (예: 넓은 이마, 앞머리로 반쯤 가림)
턱/볼: (예: 갸름한 턱선, 볼살 약간)

── 머리카락 ──
길이: (예: 어깨 5cm 아래)
스타일: (예: 자연스러운 웨이브)
색상: (예: 다크 브라운, 끝부분 약간 밝음)
앞머리: (예: 시스루 뱅)

── 체형/비율 ──
키 인상: (예: 165cm 느낌, 슬림)
체형: (예: 날씬하지만 마른 느낌은 아님, 자연스러운 체형)
어깨: (예: 좁은 어깨)
머리:전체 비율: (예: 7.5등신)
팔다리: (예: 팔다리 길고 가는 편)

── 기본 의상 ──
상의: (예: 크림색 리넨 셔츠)
하의: (예: 와이드 데님 팬츠)
신발: (예: 흰 스니커즈)
악세서리: (예: 작은 골드 귀걸이, 얇은 체인 목걸이)

── 분위기/인상 ──
전체 느낌: (예: 차분하고 지적인, 미소 지으면 따뜻한)
표정 기본값: (예: 살짝 미소 띤 중립 표정)
자세: (예: 바른 자세, 어깨 펴고)
```

### 프로필을 영어 프롬프트로 변환하는 공식

```
A [나이대] [성별] with [얼굴형] face, [피부톤] skin,
[눈 묘사], [코 묘사], [입 묘사],
[머리 길이] [머리 스타일] [머리 색] hair with [앞머리],
[체형] build with [비율] proportions,
wearing [의상 묘사],
[분위기/표정]
```

**예시 (완성형):**
```
A mid-20s Korean woman with a slim oval face, light ivory skin,
large almond-shaped brown eyes with double eyelids, small upturned nose,
full lips in natural pink,
shoulder-length dark brown hair with natural waves and see-through bangs,
slim but not skinny build with 7.5-head-tall proportions, narrow shoulders,
wearing a cream linen shirt and wide-leg denim pants with white sneakers,
calm and intelligent expression with a gentle half-smile
```

---

## 3. 나노바나나 이미지 프롬프트 템플릿

### 기본 공식
```
[캐릭터 프로필] + [행동/포즈] + [배경/환경] + [조명] + [카메라/구도] + [스타일] + [품질]
```

### 템플릿 A: 인물 중심 (상반신/전신)

```
── 캐릭터 (프로필에서 복사) ──
{캐릭터_프로필_영어}

── 행동/포즈 ──
, [행동 묘사],

── 배경 ──
in [장소], [환경 디테일],

── 조명 ──
[조명 타입] lighting,

── 카메라 ──
[샷 타입], shot on [렌즈], [앵글],

── 스타일+품질 ──
[스타일], 4K resolution, highly detailed
```

### 조명 옵션 (복사해서 쓰기)
| 분위기 | 영어 프롬프트 |
|--------|-------------|
| 따뜻하고 자연스러운 | soft natural window light, warm golden hour tones |
| 깨끗하고 밝은 | bright even studio lighting, clean white |
| 드라마틱 | dramatic side lighting with deep shadows, moody |
| 실외 낮 | outdoor daylight, soft diffused sunlight |
| 실외 밤/네온 | neon city lights at night, colorful reflections |
| 카페/실내 | warm ambient indoor lighting, cozy atmosphere |

### 카메라/구도 옵션 (복사해서 쓰기)
| 구도 | 영어 프롬프트 |
|------|-------------|
| 얼굴 클로즈업 | extreme close-up on face, 85mm portrait lens, shallow depth of field |
| 상반신 | medium close-up from waist up, 50mm lens, eye level |
| 전신 | full body shot, 35mm lens, slightly low angle |
| 3/4 앵글 | three-quarter view, 50mm lens, eye level |
| 뒤에서 | shot from behind, over-the-shoulder perspective |
| 위에서 내려다 | high angle overhead shot, bird's eye view |

### 스타일 옵션 (복사해서 쓰기)
| 스타일 | 영어 프롬프트 |
|--------|-------------|
| 사진처럼 사실적 | photorealistic, editorial photography style, DSLR quality |
| 3D 렌더링 | 3D rendered, Pixar-style, smooth shading, vibrant |
| 애니메이션 | anime style, cel-shaded, Studio Ghibli inspired |
| 일러스트 | digital illustration, clean lines, flat color, modern |
| 수채화 | watercolor painting style, soft edges, paper texture |
| 시네마틱 | cinematic still frame, film grain, anamorphic |

### 템플릿 B: 캐릭터 턴어라운드 시트 (일관성 확보용, 최초 1회)

캐릭터를 처음 만들 때 아래 프롬프트로 **턴어라운드 시트**를 먼저 생성합니다.
이 이미지가 이후 모든 장면의 레퍼런스가 됩니다.

```
Character turnaround model sheet of {캐릭터_프로필_영어}.
Full body A-pose, displayed in three views arranged horizontally:
front view (center), three-quarter view (left), back view (right).

White background, clean design, consistent proportions across all views,
character design reference sheet style, professional concept art,
highly detailed, 4K resolution.

Important: maintain exact same facial features, body proportions,
hair style, and clothing details across all three views.
```

### 템플릿 C: 표정 시트 (감정 연기용)

```
Expression sheet of {캐릭터_프로필_영어}.
Six facial expressions arranged in a 3x2 grid:
happy/smiling, surprised, thinking/contemplative,
sad/melancholic, angry/frustrated, laughing.

Close-up face shots, consistent facial features across all expressions,
white background, character design reference sheet,
highly detailed, same lighting across all panels.
```

---

## 4. 하이루오 영상 프롬프트 템플릿

### 기본 공식 (512자 제한 주의)
```
[카메라 움직임] + [인물 행동] + [환경 변화] + [분위기 키워드]
```

### 핵심: Subject Reference (S2V-01) 활용

하이루오의 **S2V-01 모델**을 사용하면 레퍼런스 이미지 1장으로 캐릭터 일관성을 유지한 영상을 만들 수 있습니다.

**사용법:**
1. 나노바나나에서 만든 최종 이미지를 **Subject Reference**로 업로드
2. 프롬프트에는 행동과 카메라만 묘사 (캐릭터 외모는 이미지가 담당)
3. 일관된 캐릭터로 다양한 장면의 영상 생성

### 템플릿 D: Image-to-Video (이미지 기반 영상)

나노바나나 이미지를 하이루오에 넣을 때:
```
[카메라] slowly [움직임 방향],
the [주체가 하는 행동],
[환경 변화/효과],
cinematic, photorealistic, natural motion, smooth camera movement
```

**예시:**
```
Camera slowly dollies in,
the woman turns her head toward the window and smiles softly,
warm morning light gradually fills the room, curtains gently swaying,
cinematic, photorealistic, natural motion, smooth camera movement
```

### 템플릿 E: Subject Reference 영상 (캐릭터 일관성)

S2V-01 모드에서 레퍼런스 이미지 업로드 후:
```
The subject [행동],
in [장소], [환경 디테일],
[카메라 무브먼트],
[분위기], cinematic quality, hyper-detailed
```

**예시:**
```
The subject walks through a busy street market,
in Seoul Myeongdong at golden hour, colorful shop signs and crowds,
tracking shot following from the side,
warm vibrant atmosphere, cinematic quality, hyper-detailed
```

### 카메라 무브먼트 옵션 (복사해서 쓰기)
| 효과 | 영어 프롬프트 |
|------|-------------|
| 천천히 다가감 | slow dolly in toward the subject |
| 천천히 멀어짐 | slow dolly out revealing the environment |
| 옆에서 따라감 | tracking shot following from the side |
| 고정 | static camera, locked off tripod shot |
| 빙글 도는 | slow orbit around the subject, 360 rotation |
| 위에서 내려옴 | crane shot descending from above |
| 1인칭 시점 | POV shot, first-person perspective |
| 줌인 | slow zoom in on the subject's face |

### 분위기 키워드 (복사해서 쓰기)
| 분위기 | 영어 프롬프트 |
|--------|-------------|
| 따뜻하고 평화로운 | warm cozy atmosphere, soft lighting, peaceful |
| 활기차고 역동적 | vibrant energetic mood, dynamic motion |
| 몽환적 | dreamy ethereal atmosphere, soft focus, hazy light |
| 긴장감 | suspenseful tense mood, dramatic shadows |
| 세련된 | sleek modern aesthetic, clean minimal |
| 감성적/슬픈 | melancholic emotional mood, muted tones |

---

## 5. 캐릭터 일관성 유지 기법

### 기법 1: 캐릭터 시트 먼저 (Foundation First)

1. **턴어라운드 시트** 생성 (템플릿 B) → 정면/측면/후면
2. **표정 시트** 생성 (템플릿 C) → 6가지 표정
3. 이 시트들을 **레퍼런스 이미지**로 모든 후속 생성에 첨부

### 기법 2: 나노바나나 멀티턴 편집

나노바나나 2는 **대화형 편집**을 지원합니다.
한 번에 완벽하게 안 나와도, 이전 결과를 유지하며 수정 가능:

```
1턴: (캐릭터 생성 프롬프트)
2턴: "Keep the same character but change the background to a coffee shop"
3턴: "Same character, same face, but now she's holding a book"
```

**핵심:** 매번 새로 생성하지 말고, 멀티턴으로 이어서 수정!

### 기법 3: 프롬프트에 일관성 강제 키워드

모든 프롬프트 끝에 아래 문구를 추가:
```
Maintain exact same facial features, body proportions, and hairstyle
as the reference. Do not alter the character's identity.
Same person, consistent appearance.
```

### 기법 4: 하이루오 S2V-01로 영상 일관성

1. 나노바나나에서 **가장 잘 나온 정면 이미지 1장** 선택
2. 하이루오 S2V-01 모드에서 **Subject Reference**로 업로드
3. 프롬프트에는 행동/카메라만 작성 (얼굴 묘사 불필요)
4. 최대 3장까지 레퍼런스 업로드 가능 (다각도면 더 정확)

### 기법 5: 이미지에서 영상 프롬프트 자동 변환 공식

이미지 프롬프트를 영상 프롬프트로 바꾸는 규칙:
```
이미지 프롬프트에서 제거: 해상도(4K), 카메라 렌즈(85mm), 포즈 고정 묘사
이미지 프롬프트에서 유지: 배경, 조명, 분위기
추가: 카메라 움직임, 인물 행동, 환경 변화, "smooth motion"
```

---

## 6. 실전 예시

### 예시: "카페에서 커피 마시는 여성" 영상 제작

**Step 1: 캐릭터 프로필 (1회 작성, 재사용)**
```
A mid-20s Korean woman with a slim oval face, light ivory skin,
large almond-shaped brown eyes with double eyelids, small upturned nose,
full lips in natural pink,
shoulder-length dark brown hair with natural waves and see-through bangs,
slim build with 7.5-head-tall proportions, narrow shoulders
```

**Step 2: 턴어라운드 시트 (최초 1회)**
```
Character turnaround model sheet of a mid-20s Korean woman with a slim
oval face, light ivory skin, large almond-shaped brown eyes with double
eyelids, small upturned nose, full lips in natural pink,
shoulder-length dark brown hair with natural waves and see-through bangs,
slim build with 7.5-head-tall proportions.
Wearing a cream linen shirt and wide-leg denim pants.
Full body A-pose, three views: front (center), three-quarter (left),
back (right). White background, character design reference sheet,
4K, highly detailed.
```

**Step 3: 장면 이미지 생성 (나노바나나)**
```
A mid-20s Korean woman with a slim oval face, light ivory skin,
large almond-shaped brown eyes with double eyelids, small upturned nose,
full lips in natural pink,
shoulder-length dark brown hair with natural waves and see-through bangs,
slim build, wearing a cream knit sweater,
sitting at a wooden table in a cozy minimalist cafe,
holding a white ceramic latte cup with both hands,
looking out through a large window with a gentle smile,
warm ambient indoor lighting, soft afternoon sun through the window,
medium close-up from waist up, 50mm lens, eye level,
photorealistic, editorial photography style, 4K resolution, highly detailed.
Maintain exact same facial features and body proportions as the reference.
```

**Step 4: 영상 프롬프트 (하이루오 S2V-01)**
→ Step 3의 이미지를 Subject Reference로 업로드 후:
```
The subject slowly lifts the latte cup and takes a gentle sip,
then lowers the cup and looks out the window with a warm smile,
soft steam rising from the cup, afternoon sunlight shifting subtly,
slow dolly in toward the subject,
warm cozy atmosphere, cinematic quality, photorealistic, natural motion
```

**결과: 기획→완성 이미지→영상까지 프롬프트 3개로 끝**

---

## 빠른 참조 체크리스트

- [ ] 캐릭터 프로필 시트 작성했는가?
- [ ] 턴어라운드 시트를 먼저 생성했는가?
- [ ] 프롬프트에 캐릭터 프로필 전문을 포함했는가?
- [ ] 일관성 강제 키워드를 끝에 추가했는가?
- [ ] 하이루오에 Subject Reference 이미지를 업로드했는가?
- [ ] 영상 프롬프트에서 캐릭터 외모 묘사를 빼고 행동/카메라만 썼는가?

---

## Sources
- [Nano Banana Pro Face Consistency Guide](https://blog.laozhang.ai/en/posts/nano-banana-pro-face-consistency-guide)
- [Nano Banana Character Sheet Prompt Library](https://nanobanana.pro/character-sheet-prompt)
- [Nano Banana Prompt Guide (Google Cloud)](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana)
- [Hailuo AI Character Consistency Guide](https://hailuoai.video/pages/blog/ai-video-character-consistency-guide)
- [Hailuo S2V-01 Subject Reference](https://www.minimax.io/news/s2v-01-release)
- [Hailuo Prompt Guide (ImagineArt)](https://www.imagine.art/blogs/hailuo-ai-prompt-guide)
