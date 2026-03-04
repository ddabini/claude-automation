# VELA 프롬프트 가이드

> AI 영상 생성의 품질은 프롬프트가 80%를 결정합니다.
> 이 가이드를 따라하면 누구나 프로급 영상을 만들 수 있습니다.

---

## 목차

1. [프롬프트 기본 공식](#1-프롬프트-기본-공식)
2. [스타일별 프롬프트 템플릿](#2-스타일별-프롬프트-템플릿)
3. [카메라 워크 키워드 사전](#3-카메라-워크-키워드-사전)
4. [조명/분위기 키워드 사전](#4-조명분위기-키워드-사전)
5. [네거티브 프롬프트 가이드](#5-네거티브-프롬프트-가이드)
6. [실전 프롬프트 예시 30개](#6-실전-프롬프트-예시-30개)
7. [프롬프트 개선 체크리스트](#7-프롬프트-개선-체크리스트)
8. [흔한 실수 & 해결법](#8-흔한-실수--해결법)

---

## 1. 프롬프트 기본 공식

AI 영상 프롬프트는 6가지 구성요소의 조합입니다. 마치 영화 촬영 지시서를 쓰는 것처럼, 각 요소를 구체적으로 적을수록 원하는 영상에 가까워집니다.

### 핵심 공식

```
[카메라] + [주체] + [동작] + [장소/배경] + [조명/분위기] + [스타일]
```

> **예시 완성형:**
> `Slow dolly in on a young woman sipping coffee at a wooden table, morning golden hour light streaming through the window, warm cinematic tones, shot on 35mm film, shallow depth of field`

### 6가지 구성요소 상세

---

#### 1) 주체 (Subject) — 누가/무엇이 화면에 나오는가

화면의 중심이 되는 대상입니다. 외모, 옷차림, 표정 등을 구체적으로 묘사할수록 좋습니다.

| 카테고리 | 자주 쓰는 키워드 |
|---------|----------------|
| **인물** | a young woman, an elderly man, a child, a couple, a group of friends |
| **인물 묘사** | wearing a white dress, with curly hair, smiling softly, looking at camera |
| **동물** | a golden retriever, a white cat, a flock of birds, a butterfly |
| **사물** | a ceramic coffee cup, a vintage camera, a red sports car, a bouquet of flowers |
| **음식** | a steaming bowl of ramen, freshly baked bread, a colorful fruit platter |
| **건축** | a glass skyscraper, a traditional Korean hanok, a rustic wooden cabin |
| **자연** | a towering waterfall, cherry blossom trees, rolling ocean waves |

> **팁:** "a woman"보다 "a young woman in her 20s with short black hair wearing a beige trench coat"가 훨씬 정확한 결과를 냅니다.

---

#### 2) 동작 (Action) — 무엇을 하고 있는가

영상은 '움직임'이 생명입니다. 정지 사진과 다르게, 동작을 반드시 포함해야 합니다.

| 카테고리 | 자주 쓰는 키워드 |
|---------|----------------|
| **일상 동작** | walking slowly, sipping coffee, reading a book, typing on a laptop |
| **활동적 동작** | running through, dancing gracefully, jumping over, climbing up |
| **미세한 동작** | hair blowing in the wind, steam rising from a cup, leaves gently falling |
| **카메라 대상 동작** | turning to face the camera, looking over shoulder, reaching toward camera |
| **환경 동작** | clouds drifting across the sky, waves crashing on shore, traffic flowing |
| **변환 동작** | transforming into, dissolving into particles, morphing from A to B |
| **속도 제어** | in slow motion, time-lapse, at normal speed, rapidly accelerating |

> **팁:** "걷다"보다 "천천히 걸어가다(walking slowly)", "빗속을 뛰어가다(running through the rain)"처럼 구체적으로 쓰세요.

---

#### 3) 배경/장소 (Setting) — 어디에서

장면이 펼쳐지는 공간입니다. 시간대, 날씨, 계절까지 포함하면 더 풍부해집니다.

| 카테고리 | 자주 쓰는 키워드 |
|---------|----------------|
| **실내** | in a cozy cafe, in a modern office, in a bright kitchen, in a dimly lit bar |
| **실외 도시** | on a busy city street, at a rooftop overlooking the skyline, in a neon-lit alley |
| **실외 자연** | in a misty forest, on a sandy beach at sunset, in a flower field, on a mountain peak |
| **시간대** | at dawn, during golden hour, at twilight, late at night, at blue hour |
| **날씨** | on a rainy day, in heavy snow, under a clear blue sky, in thick fog |
| **계절** | in spring with cherry blossoms, on a hot summer day, autumn leaves falling, winter snowscape |
| **판타지** | in a futuristic city, on an alien planet, in an underwater kingdom, in a floating castle |

---

#### 4) 조명/분위기 (Mood & Lighting) — 어떤 느낌인가

같은 장면도 조명과 분위기에 따라 완전히 다른 감정을 전달합니다.

| 카테고리 | 자주 쓰는 키워드 |
|---------|----------------|
| **따뜻한** | warm tones, golden light, cozy atmosphere, soft glow |
| **차가운** | cool tones, blue hour lighting, icy cold atmosphere |
| **드라마틱** | dramatic lighting, high contrast, deep shadows, chiaroscuro |
| **몽환적** | dreamy, ethereal, soft bokeh, hazy, glowing, magical |
| **어두운** | moody, dark atmosphere, dimly lit, noir lighting |
| **밝고 활기찬** | vibrant, bright and airy, energetic, lively colors |
| **고요한** | serene, peaceful, tranquil, minimalist, calm |

---

#### 5) 카메라 (Camera) — 어떤 앵글/움직임으로 촬영하는가

카메라 지시를 넣으면 AI가 촬영 기법을 흉내냅니다. (자세한 키워드는 [3장](#3-카메라-워크-키워드-사전) 참조)

| 카테고리 | 자주 쓰는 키워드 |
|---------|----------------|
| **구도** | close-up, medium shot, wide shot, extreme close-up, bird's eye view |
| **움직임** | slow dolly in, tracking shot, smooth pan left, orbit around, crane shot rising |
| **렌즈** | shot on 35mm film, wide-angle lens, fisheye lens, anamorphic lens |
| **피사계심도** | shallow depth of field, deep focus, bokeh background, tilt-shift |

---

#### 6) 스타일 (Style) — 어떤 영상 스타일인가

전체적인 영상의 '룩'을 결정합니다.

| 카테고리 | 자주 쓰는 키워드 |
|---------|----------------|
| **영화** | cinematic, film noir, shot on 35mm, anamorphic, blockbuster |
| **다큐** | documentary style, handheld camera, natural footage |
| **광고** | commercial quality, professional product shot, clean and polished |
| **애니메이션** | 2D animation, 3D Pixar style, watercolor animation, anime style, cel shaded |
| **아트** | oil painting style, impressionist, surrealist, abstract art, cyberpunk |
| **레트로** | VHS aesthetic, 90s camcorder, vintage 8mm film, retro grain |
| **기타** | photorealistic, hyperrealistic, minimalist, high fashion editorial |

---

## 2. 스타일별 프롬프트 템플릿

VELA에서 자주 사용하는 5가지 스타일별로 바로 활용 가능한 템플릿입니다. `[괄호]` 안의 내용을 원하는 대로 바꿔 쓰세요.

---

### 2-1. 시네마틱 (Cinematic)

> 영화 같은 고급 영상. 깊은 색감, 얕은 피사계심도, 드라마틱한 조명이 특징.

**공식:**
```
Cinematic shot of [주체] [동작], [조명], shot on 35mm film, shallow depth of field, [색감]
```

**예시 1 — 인물 감성**
```
Cinematic shot of a young woman standing alone on a train platform at dusk,
warm golden backlight casting long shadows, shot on 35mm film, shallow depth
of field, warm amber tones, gentle wind blowing her hair
```
> 한국어 설명: 해질녘 기차 플랫폼에 홀로 서 있는 젊은 여성. 뒤에서 비추는 황금빛 역광이 긴 그림자를 드리우고, 바람에 머리카락이 날리는 감성적 장면.

**예시 2 — 액션/서사**
```
Cinematic tracking shot of a man in a dark coat walking through a rain-soaked
neon-lit alley at night, reflections on wet pavement, dramatic rim lighting,
anamorphic lens flare, moody blue and orange color grade
```
> 한국어 설명: 비에 젖은 네온 골목을 걸어가는 검은 코트의 남자. 젖은 바닥에 네온 빛이 반사되고, 블루-오렌지 색감의 영화적 분위기.

**예시 3 — 자연 서사시**
```
Cinematic aerial shot slowly rising above a vast misty mountain range at
sunrise, volumetric light rays piercing through clouds, epic orchestral feel,
shot on IMAX, deep rich greens and golden highlights
```
> 한국어 설명: 일출 시 안개 낀 산맥 위로 서서히 올라가는 항공 촬영. 구름 사이로 빛줄기가 비치며 장엄한 대자연의 파노라마.

---

### 2-2. 브이로그 (Vlog)

> 자연스럽고 일상적인 느낌. 핸드헬드 카메라, 자연광, 캐주얼한 톤이 특징.

**공식:**
```
Handheld camera following [주체] [동작], natural lighting, casual everyday feel, [장소]
```

**예시 1 — 카페 일상**
```
Handheld camera following a young woman browsing a cozy bookshop cafe,
picking up a book and smiling, natural window light, warm casual everyday
feel, slight camera shake, authentic and candid
```
> 한국어 설명: 아늑한 북카페에서 책을 고르며 미소 짓는 여성을 핸드헬드 카메라로 따라가는 자연스러운 브이로그 느낌.

**예시 2 — 여행**
```
POV handheld shot walking through a vibrant street market in Southeast Asia,
colorful food stalls and hanging lanterns, bustling crowd, natural daylight,
travel vlog aesthetic, lively and immersive
```
> 한국어 설명: 동남아 시장 골목을 1인칭 시점으로 걸어가는 여행 브이로그. 알록달록한 음식 노점과 등불, 북적이는 인파.

**예시 3 — 요리**
```
Overhead handheld shot of hands preparing a fresh salad on a wooden cutting
board, chopping vegetables, natural kitchen light from a side window, relaxed
homey atmosphere, cooking vlog style
```
> 한국어 설명: 나무 도마 위에서 샐러드를 만드는 손을 위에서 내려다보는 쿠킹 브이로그. 창문으로 들어오는 자연광, 편안한 집밥 느낌.

---

### 2-3. 애니메이션 (Animation)

> 다양한 그림체의 애니메이션. 2D, 3D, 수채화 등 스타일 지정이 핵심.

**공식:**
```
[스타일] animation of [주체] [동작], vibrant colors, [분위기], smooth motion
```

**예시 1 — 2D 감성 애니메이션**
```
2D hand-drawn animation of a small fox sitting on a hilltop watching a
sunset, soft pastel colors, gentle breeze moving the grass, Studio Ghibli
inspired, warm and nostalgic, smooth flowing motion
```
> 한국어 설명: 언덕 위에 앉아 석양을 바라보는 작은 여우. 지브리 스타일의 따뜻한 파스텔 색감, 바람에 살랑이는 풀밭.

**예시 2 — 3D 픽사 스타일**
```
3D Pixar-style animation of a cheerful robot waving hello in a futuristic
city, bright and colorful buildings, floating cars in the background, playful
and energetic mood, smooth character animation
```
> 한국어 설명: 미래 도시에서 손을 흔드는 귀여운 로봇. 픽사 스타일의 밝고 컬러풀한 3D 애니메이션, 배경에 날아다니는 자동차들.

**예시 3 — 수채화 애니메이션**
```
Watercolor animation of cherry blossom petals gently falling over a quiet
Japanese garden with a koi pond, soft pink and green tones, peaceful and
meditative, delicate brushstroke textures, flowing water ripples
```
> 한국어 설명: 잉어 연못이 있는 고요한 일본 정원 위로 벚꽃잎이 흩날리는 수채화 애니메이션. 섬세한 붓터치와 평화로운 분위기.

---

### 2-4. 광고 (Commercial)

> 깔끔하고 전문적인 제품 촬영 느낌. 정교한 조명, 세련된 배경이 특징.

**공식:**
```
Professional commercial shot of [제품/서비스], [조명], clean background, [무드], product showcase
```

**예시 1 — 제품 (화장품)**
```
Professional commercial shot of a luxury skincare bottle rotating slowly on a
marble surface, soft studio lighting with a subtle golden rim light, clean
white background, water droplets on the bottle, elegant and premium feel,
product showcase
```
> 한국어 설명: 대리석 위에서 천천히 회전하는 고급 스킨케어 병. 부드러운 스튜디오 조명에 금빛 림라이트, 물방울이 맺힌 프리미엄 화장품 광고.

**예시 2 — 음식 (커피)**
```
Close-up commercial shot of hot coffee being poured into a ceramic cup in
slow motion, rich brown liquid with crema forming, steam rising gracefully,
warm side lighting on a dark wooden table, appetizing and inviting, food
commercial quality
```
> 한국어 설명: 슬로우 모션으로 세라믹 컵에 따라지는 뜨거운 커피. 크레마가 형성되며 우아하게 올라오는 김, 식욕을 자극하는 음식 광고.

**예시 3 — 패션**
```
Fashion commercial shot of a model in a flowing white dress walking through
a sunlit wheat field, golden hour backlight, fabric billowing in the wind,
slow motion, high-end editorial style, desaturated warm tones
```
> 한국어 설명: 햇살 가득한 밀밭을 걸어가는 흰 드레스의 모델. 바람에 펄럭이는 원단, 골든아워 역광, 하이엔드 패션 에디토리얼 느낌.

---

### 2-5. 뉴스/인포 (News & Info)

> 정보 전달 목적의 깔끔한 영상. 전문적 조명, 안정적 구도, 정돈된 화면이 특징.

**공식:**
```
News broadcast style, [주체/장면], professional lighting, clean composition, informative tone
```

**예시 1 — 뉴스 앵커**
```
News broadcast style, a professional anchor sitting at a modern news desk
with a large screen behind showing a city skyline, bright even studio
lighting, clean and polished composition, neutral color palette, informative
and trustworthy tone
```
> 한국어 설명: 현대적 뉴스 데스크에 앉은 앵커. 뒤편 대형 스크린에 도시 스카이라인, 밝고 균일한 스튜디오 조명, 신뢰감 있는 뉴스 분위기.

**예시 2 — 데이터 시각화**
```
Clean infographic animation style, a 3D bar chart rising from a dark surface
with glowing blue data points, smooth camera orbit around the visualization,
professional and modern, dark background with accent lighting, tech corporate
feel
```
> 한국어 설명: 어두운 배경에서 파란 빛을 내며 솟아오르는 3D 막대 차트. 데이터 시각화를 카메라가 부드럽게 공전하며 보여주는 인포그래픽 스타일.

**예시 3 — 현장 리포트**
```
Documentary news style, aerial drone shot slowly revealing a large solar
panel farm stretching across a desert landscape, bright midday sun, clean
wide composition, informative and educational, subtle camera movement
```
> 한국어 설명: 사막에 펼쳐진 대규모 태양광 발전소를 드론이 서서히 공개하는 다큐멘터리 뉴스 스타일. 깔끔한 와이드 구도의 정보 전달 영상.

---

## 3. 카메라 워크 키워드 사전

프롬프트에 카메라 키워드를 넣으면 AI가 해당 촬영 기법을 반영합니다. 원하는 느낌에 맞는 키워드를 골라 프롬프트 앞부분에 넣으세요.

### 3-1. 카메라 움직임

| 키워드 | 설명 | 적합한 상황 | 예시 프롬프트 일부 |
|--------|------|-------------|------------------|
| **static shot, locked-off camera** | 카메라를 고정한 채 촬영. 안정감 있음 | 인터뷰, 제품 촬영, 풍경 고정 | `Static shot of a candle flickering...` |
| **slow pan left/right** | 카메라를 좌우로 천천히 이동 | 넓은 풍경, 실내 공간 소개, 여러 인물 | `Slow pan right across a bustling market...` |
| **tilt up / tilt down** | 카메라를 위아래로 기울이며 촬영 | 건물 전체 보여주기, 인물 등장 연출 | `Slow tilt up revealing a towering skyscraper...` |
| **slow zoom in** | 멀리서 점점 가까이 다가가는 느낌 | 감정 강조, 긴장감 고조, 디테일 포착 | `Slow zoom in on a woman's eyes filling with tears...` |
| **dolly in / dolly out** | 카메라 자체가 앞뒤로 이동 (줌과 다름) | 주체에 다가가거나 벗어나는 서사적 연출 | `Dolly in toward a mysterious door at the end of a hallway...` |
| **dolly zoom (vertigo effect)** | 줌과 달리 이동으로 원근 왜곡 | 충격적 장면, 긴장 극대화, 심리 표현 | `Dolly zoom on a man standing at the edge of a cliff...` |
| **tracking shot, following shot** | 움직이는 대상을 따라가며 촬영 | 걷거나 뛰는 인물, 자동차 추격 | `Tracking shot following a cyclist through city streets...` |
| **orbit shot** | 주체를 중심으로 카메라가 360도 회전 | 제품 전시, 인물 드라마틱 등장, 건축물 | `Orbit shot around a dancer performing on stage...` |
| **aerial drone shot, bird's eye view** | 하늘에서 아래를 내려다보며 촬영 | 풍경, 도시 전경, 군중, 대자연 | `Aerial drone shot over a winding river through autumn forest...` |
| **handheld, shaky cam** | 손으로 들고 촬영한 듯한 흔들림 | 브이로그, 다큐, 긴박한 장면, 현장감 | `Handheld camera running through a crowded street...` |
| **crane shot, rising shot** | 아래에서 위로 올라가는 수직 이동 | 장엄한 공개 장면, 건물 외관, 클라이맥스 | `Crane shot rising from street level to reveal the city skyline...` |
| **push in / pull back** | 카메라가 주체 쪽으로 전진 또는 후퇴 | 포커스 전환, 전체-부분 관계 보여주기 | `Camera slowly pulls back to reveal a vast desert landscape...` |
| **first-person view (FPV)** | 1인칭 시점. 관객이 직접 체험하는 느낌 | 여행, 게임 느낌, 몰입형 콘텐츠 | `FPV drone flying through a narrow canyon at high speed...` |

### 3-2. 카메라 구도 (Shot Size)

| 키워드 | 화면에 보이는 범위 | 주로 쓰는 곳 |
|--------|------------------|-------------|
| **extreme close-up (ECU)** | 눈, 입술, 손가락 등 극도로 가까이 | 감정, 디테일, 질감 강조 |
| **close-up (CU)** | 얼굴 전체 또는 제품 하나 | 인물 감정, 제품 촬영 |
| **medium close-up (MCU)** | 가슴 위로 | 인터뷰, 대화 장면 |
| **medium shot (MS)** | 허리 위로 | 일상 장면, 동작 |
| **full shot** | 인물 전신 | 패션, 춤, 전신 동작 |
| **wide shot / long shot** | 인물 + 넓은 배경 | 풍경 속 인물, 장소 소개 |
| **extreme wide shot (EWS)** | 아주 넓은 전경 (인물은 작게) | 대자연, 도시 전경, 스케일 강조 |

### 3-3. 렌즈 효과

| 키워드 | 효과 | 분위기 |
|--------|------|--------|
| **shot on 35mm film** | 필름 특유의 입자감과 색감 | 시네마틱, 빈티지 |
| **anamorphic lens** | 수평 렌즈 플레어, 와이드스크린 | 영화적, 드라마틱 |
| **wide-angle lens** | 넓은 화각, 약간의 왜곡 | 공간감, 역동적 |
| **fisheye lens** | 극단적 왜곡, 볼록 렌즈 효과 | 스케이트보드, 힙합, 유니크 |
| **tilt-shift lens** | 미니어처처럼 보이는 효과 | 도시 풍경을 장난감처럼 |
| **shallow depth of field** | 배경 흐림, 주체만 선명 | 인물 강조, 감성적 |
| **deep focus** | 전경~배경 모두 선명 | 다큐멘터리, 풍경 |

---

## 4. 조명/분위기 키워드 사전

조명과 분위기 키워드는 영상의 감정을 결정합니다. 같은 장면이라도 이 키워드만 바꾸면 완전히 다른 느낌이 됩니다.

### 4-1. 자연광 (Natural Light)

| 키워드 | 설명 | 느낌 |
|--------|------|------|
| **golden hour** | 해 뜨고/지기 직전의 황금빛 | 따뜻하고 감성적, 로맨틱 |
| **blue hour** | 해 지고 난 직후의 푸른 하늘 | 고요하고 신비로운 |
| **overcast soft light** | 구름 낀 날의 부드럽고 고른 빛 | 차분하고 부드러운 |
| **harsh midday sun** | 한낮의 강한 직사광선 | 강렬하고 선명한, 그림자 진한 |
| **dappled sunlight** | 나뭇잎 사이로 비치는 얼룩진 빛 | 자연스럽고 평화로운 |
| **sunrise / sunset** | 일출 또는 일몰의 드라마틱한 빛 | 장엄하고 감동적인 |
| **moonlight** | 달빛으로만 비추는 밤 장면 | 신비롭고 고요한, 로맨틱 |
| **foggy / misty light** | 안개 속에서 빛이 흩어지는 효과 | 몽환적이고 미스터리한 |

### 4-2. 인공광 (Artificial Light)

| 키워드 | 설명 | 느낌 |
|--------|------|------|
| **neon lights** | 네온 간판의 컬러풀한 빛 | 도시적, 나이트라이프, 사이버펑크 |
| **studio lighting** | 전문 스튜디오의 균일한 조명 | 깔끔하고 전문적인 |
| **rim lighting** | 뒤에서 비추어 윤곽선을 강조 | 드라마틱, 신비로운 |
| **backlit silhouette** | 강한 역광으로 실루엣만 보이게 | 미스터리, 감성적 |
| **candlelight** | 촛불의 따뜻하고 흔들리는 빛 | 따뜻하고 친밀한, 로맨틱 |
| **fluorescent light** | 형광등의 차갑고 균일한 빛 | 사무실, 병원, 현실적 |
| **spotlight** | 한 곳만 집중 조명 | 무대, 강조, 극적 |
| **practical lights** | 장면 속 실제 조명 (램프, 전구 등) | 자연스러운 실내 분위기 |

### 4-3. 분위기/감정 키워드

| 키워드 | 느낌 |
|--------|------|
| **moody** | 어둡고 감정적인, 무거운 |
| **dreamy** | 꿈결 같은, 몽환적인 |
| **ethereal** | 천상의, 비현실적으로 아름다운 |
| **dramatic** | 극적이고 강렬한 |
| **cozy** | 아늑하고 포근한 |
| **vibrant** | 생동감 넘치고 활기찬 |
| **muted** | 채도가 낮고 차분한 |
| **dark and gritty** | 어둡고 거친, 사실적 |
| **nostalgic** | 향수를 불러일으키는, 그리운 |
| **serene** | 고요하고 평화로운 |
| **mysterious** | 신비롭고 궁금증을 자아내는 |
| **majestic** | 장엄하고 위엄 있는 |
| **playful** | 장난스럽고 가벼운 |
| **melancholic** | 우울하고 쓸쓸한 |
| **tense** | 긴장감 넘치는, 불안한 |

### 4-4. 색감/색보정 키워드

| 키워드 | 효과 |
|--------|------|
| **warm tones** | 노란~주황 계열 따뜻한 색감 |
| **cool tones** | 파란~보라 계열 차가운 색감 |
| **desaturated** | 채도를 낮춘, 차분한 |
| **high contrast** | 명암 대비가 강한 |
| **low contrast** | 부드럽고 편안한 톤 |
| **pastel colors** | 연한 파스텔 톤 |
| **rich and saturated** | 짙고 선명한 색 |
| **monochrome** | 흑백 또는 단색 계열 |
| **teal and orange** | 시네마틱의 대표 색조합 |
| **vintage color grade** | 바랜 듯한 레트로 색감 |

---

## 5. 네거티브 프롬프트 가이드

네거티브 프롬프트는 "이런 건 만들지 마"라고 AI에게 알려주는 것입니다. 사용하면 불필요한 요소를 줄이고 품질을 높일 수 있습니다.

### 5-1. 기본 추천 네거티브 프롬프트

> 어떤 영상이든 아래 기본 세트를 넣으면 전반적 품질이 올라갑니다.

```
blurry, low quality, distorted, watermark, text overlay, choppy motion,
morphing artifacts, deformed, ugly, low resolution
```

### 5-2. 상황별 추가 네거티브 프롬프트

**인물 영상**
```
deformed face, extra fingers, extra limbs, distorted body proportions,
unnatural skin texture, crossed eyes, mutated hands, bad anatomy,
disfigured, poorly drawn face
```

**풍경/자연 영상**
```
oversaturated, artificial looking, plastic texture, repeating patterns,
unnatural colors, floating objects, broken horizon line
```

**제품/광고 영상**
```
text on product, wrong proportions, melting edges, inconsistent lighting,
cluttered background, distracting elements, logo distortion
```

**애니메이션**
```
inconsistent style, frame drops, jerky animation, mixed art styles,
realistic mixed with cartoon, uncanny valley
```

**음식 영상**
```
unappetizing, grey food, melting plates, unnatural food colors,
plastic looking food, distorted utensils
```

### 5-3. 네거티브 프롬프트 활용 팁

| 팁 | 설명 |
|----|------|
| **기본 세트는 항상** | 위의 기본 추천 세트는 모든 영상에 넣으세요 |
| **상황별로 추가** | 인물이면 인물용, 제품이면 제품용을 기본에 더하세요 |
| **과하게 넣지 말 것** | 너무 많은 제약은 AI의 자유도를 떨어뜨립니다 |
| **구체적으로** | "bad"보다는 "blurry"처럼 명확한 키워드가 효과적입니다 |

---

## 6. 실전 프롬프트 예시 30개

바로 복사해서 VELA에 붙여넣을 수 있는 프롬프트입니다. 각 예시의 `[괄호]` 내용은 상황에 맞게 조정하세요.

---

### 풍경/자연 (5개)

---

**#01. 안개 낀 호수의 일출**

```
Slow aerial drone shot rising above a misty lake at sunrise, golden light
breaking through low-hanging clouds, mirror-like water reflecting orange and
pink sky, birds flying in the distance, serene and majestic, cinematic,
4K quality
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 이른 아침 안개 낀 호수 위를 드론이 천천히 올라가며 촬영. 수면에 비친 황금빛 일출과 날아가는 새들. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, low quality, distorted, watermark, oversaturated, artificial looking` |

---

**#02. 벚꽃 터널**

```
Tracking shot moving forward through a tunnel of cherry blossom trees in full
bloom, petals gently falling and floating in the air, soft pink and white
colors, dappled sunlight filtering through branches, dreamy spring atmosphere,
shallow depth of field
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 만개한 벚꽃 터널 사이를 앞으로 나아가는 촬영. 꽃잎이 흩날리고 나뭇가지 사이로 햇살이 비치는 봄날의 몽환적 풍경. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, low quality, watermark, oversaturated, unnatural colors` |

---

**#03. 폭풍 치는 바다**

```
Wide shot of massive ocean waves crashing against dark rocky cliffs during a
storm, dramatic grey sky with lightning in the distance, white sea foam
spraying high, powerful and awe-inspiring, moody dark tones, cinematic slow
motion
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 폭풍 속 거대한 파도가 검은 절벽에 부딪히는 장면. 먼 하늘에 번개가 치고, 하얀 파도 거품이 높이 솟는 장엄한 바다. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, low quality, distorted, watermark, calm water, sunny` |

---

**#04. 가을 숲길**

```
Smooth dolly shot along a winding forest path covered in golden and red
autumn leaves, tall trees forming a natural canopy, warm afternoon sunlight
casting long shadows, a gentle breeze rustling the leaves, peaceful and
nostalgic, warm color grade
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 황금빛과 붉은 낙엽으로 뒤덮인 숲 속 오솔길을 따라 천천히 이동하는 촬영. 높은 나무들 사이로 오후 햇살, 바람에 살랑이는 나뭇잎. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, low quality, watermark, winter, snow, artificial looking` |

---

**#05. 밤하늘 타임랩스**

```
Static shot time-lapse of the Milky Way rotating across a clear night sky
above a desert landscape, millions of stars visible, a lone dead tree
silhouetted in the foreground, deep blues and purples, awe-inspiring and
vast, astrophotography style
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 사막 위 맑은 밤하늘에서 은하수가 회전하는 타임랩스. 전경에 고목 실루엣, 수백만 개의 별이 빛나는 천체 사진 스타일. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, low quality, watermark, clouds, light pollution, daytime` |

---

### 인물/라이프스타일 (5개)

---

**#06. 카페에서 책 읽는 여성**

```
Medium close-up of a young woman reading a book in a sunlit cafe, steam
rising from a coffee cup beside her, warm golden morning light through large
windows, soft bokeh background with other patrons, cozy and peaceful,
natural cinematic look
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 햇살 가득한 카페에서 책을 읽는 젊은 여성. 옆에 놓인 커피잔에서 올라오는 김, 큰 창문으로 들어오는 따뜻한 아침 빛. |
| 추천 스타일 | 브이로그 |
| 추천 길이 | 3~4초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, distorted face, extra fingers, watermark, deformed` |

---

**#07. 빗속을 걷는 커플**

```
Tracking shot of a couple sharing an umbrella while walking down a rainy
city street at night, neon reflections on wet pavement, warm street lamp
glow, romantic and intimate mood, slow motion raindrops, cinematic shallow
depth of field
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 비 오는 밤 도시 거리에서 우산을 나눠 쓰고 걷는 커플. 젖은 도로에 비치는 네온 불빛, 로맨틱하고 따뜻한 분위기. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, distorted, deformed face, bad anatomy, watermark, daytime` |

---

**#08. 요가하는 여성**

```
Wide shot of a woman practicing yoga on a wooden deck overlooking a calm
ocean at sunrise, smooth slow transition between poses, flowing white
clothes moving with the breeze, golden hour light, serene and balanced,
wellness lifestyle aesthetic
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 일출 시 잔잔한 바다가 내려다보이는 나무 데크에서 요가하는 여성. 부드러운 동작 전환, 바람에 날리는 흰 옷, 평화로운 웰니스 라이프. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, distorted body, bad anatomy, watermark, choppy motion` |

---

**#09. 스트리트 댄서**

```
Dynamic handheld shot of a street dancer performing breakdance moves in an
urban underpass, spray-painted graffiti walls, dramatic side lighting casting
sharp shadows, energetic and raw, hip-hop culture vibe, slow motion spin
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 그래피티가 가득한 도시 지하도에서 브레이크댄스를 추는 스트리트 댄서. 옆에서 비추는 강한 조명, 날카로운 그림자, 에너지 넘치는 힙합 분위기. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 3~4초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, distorted body, bad anatomy, watermark, slow and boring` |

---

**#10. 아이와 강아지**

```
Medium shot of a small child laughing and playing with a golden retriever
puppy in a sunny backyard garden, green grass, wildflowers, natural afternoon
light, joyful and heartwarming, authentic candid moment, warm soft tones
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 햇살 가득한 뒷마당에서 골든 리트리버 강아지와 웃으며 노는 아이. 초록 잔디와 들꽃, 따뜻하고 진심 어린 순간의 포착. |
| 추천 스타일 | 브이로그 |
| 추천 길이 | 3~4초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, distorted face, deformed, watermark, dark, scary` |

---

### 음식/요리 (5개)

---

**#11. 라떼 아트**

```
Extreme close-up top-down shot of a barista pouring steamed milk into a
coffee cup creating latte art, smooth and precise pour, rich brown espresso
swirling with white milk, warm cafe ambient light, satisfying and mesmerizing,
slow motion
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 위에서 내려다보는 극접사. 바리스타가 스팀 밀크를 부어 라떼 아트를 만드는 과정. 에스프레소와 우유가 만들어내는 아름다운 패턴. |
| 추천 스타일 | 광고 |
| 추천 길이 | 3~4초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, spilled coffee, ugly, low quality, grey food` |

---

**#12. 피자 치즈 늘어나는 장면**

```
Close-up slow motion shot of a hand lifting a slice of hot pepperoni pizza
with melted mozzarella cheese stretching in long golden strings, steam rising,
warm overhead lighting on a rustic wooden table, appetizing and indulgent,
food commercial quality
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 뜨거운 페퍼로니 피자 한 조각을 들어올리면 모짜렐라 치즈가 길게 늘어나는 슬로우 모션. 올라오는 김, 식욕을 자극하는 음식 광고 퀄리티. |
| 추천 스타일 | 광고 |
| 추천 길이 | 3~4초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, unappetizing, plastic looking, distorted, grey food` |

---

**#13. 한식 상차림**

```
Smooth overhead dolly shot revealing a beautifully arranged Korean traditional
meal with multiple colorful banchan side dishes, steaming rice, kimchi jjigae
bubbling, natural warm lighting, clean wooden table, elegant and appetizing,
food photography style
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 위에서 천천히 이동하며 보여주는 한식 상차림. 알록달록한 반찬들, 김이 오르는 밥, 보글보글 끓는 김치찌개. 정갈하고 식욕을 돋우는 푸드 포토. |
| 추천 스타일 | 광고 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, unappetizing, messy, unnatural food colors, low quality` |

---

**#14. 초콜릿 퐁듀**

```
Close-up of a fresh strawberry being slowly dipped into a flowing stream of
rich dark melted chocolate, glossy chocolate coating forming perfectly, drips
falling in slow motion, warm studio lighting, luxurious and indulgent,
dessert commercial aesthetic
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 신선한 딸기를 진한 다크 초콜릿에 천천히 담그는 클로즈업. 완벽하게 코팅되는 윤기 나는 초콜릿, 슬로우 모션으로 떨어지는 방울. |
| 추천 스타일 | 광고 |
| 추천 길이 | 3~4초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, melting plate, unappetizing, distorted, low quality` |

---

**#15. 라면 먹방**

```
Medium close-up shot of chopsticks lifting steaming noodles from a bowl of
rich spicy Korean ramyeon, thick red broth with floating green onions and an
egg, steam swirling upward, warm overhead lighting, comfort food mood,
mukbang style, appetizing
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 젓가락으로 김이 모락모락 나는 라면 면발을 들어올리는 장면. 진한 빨간 국물에 파와 계란, 따뜻한 조명, 먹방 스타일의 편안한 음식 영상. |
| 추천 스타일 | 브이로그 |
| 추천 길이 | 3~4초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, unappetizing, grey food, distorted utensils, low quality` |

---

### 제품/상업 (5개)

---

**#16. 스니커즈 제품 촬영**

```
Orbit shot around a pair of brand new white sneakers floating and rotating
slowly against a clean gradient background, dramatic studio lighting with
colored rim lights in blue and orange, particles of dust floating, premium
product showcase, sleek and modern
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 깔끔한 그라데이션 배경에서 천천히 회전하는 새 흰색 스니커즈. 블루-오렌지 림라이트, 먼지 입자가 떠다니는 프리미엄 제품 쇼케이스. |
| 추천 스타일 | 광고 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, wrong proportions, distorted, cluttered background, text` |

---

**#17. 향수 광고**

```
Cinematic close-up of a luxury perfume bottle on a reflective black surface,
golden liquid inside catching the light, a single drop of water rolling down
the glass, dramatic rim lighting, dark moody atmosphere with subtle golden
accents, premium fragrance commercial
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 반사되는 검은 표면 위의 고급 향수 병. 골든 액체가 빛을 받아 반짝이고, 유리 위를 구르는 물방울, 어두운 배경에 금빛 악센트. |
| 추천 스타일 | 광고 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, text on product, melting edges, cheap looking, low quality` |

---

**#18. 스마트워치 착용샷**

```
Close-up of a person's wrist wearing a sleek smartwatch with a glowing
digital display, the watch face changing through different screens, modern
office environment blurred in background, clean natural lighting, tech
lifestyle, contemporary and sophisticated
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 빛나는 디지털 화면의 세련된 스마트워치를 착용한 손목 클로즈업. 화면이 바뀌며, 배경은 모던 오피스가 흐릿하게 보이는 테크 라이프 스타일 영상. |
| 추천 스타일 | 광고 |
| 추천 길이 | 3~4초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, distorted screen, wrong proportions, low quality` |

---

**#19. 자동차 주행 광고**

```
Tracking aerial shot of a sleek black sports car driving along a winding
coastal road, turquoise ocean on one side and green mountains on the other,
golden hour lighting, car reflecting the sunset, cinematic automotive
commercial, dynamic and aspirational
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 구불구불한 해안 도로를 달리는 세련된 검정 스포츠카를 항공 촬영. 한쪽은 청록 바다, 한쪽은 녹색 산. 석양이 차체에 반사되는 자동차 광고. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, wrong proportions, distorted car, low quality, static` |

---

**#20. 음료 광고**

```
Slow motion close-up of ice cubes splashing into a glass of vibrant orange
juice, liquid splashing upward with droplets catching the light, fresh orange
slices beside the glass, bright clean white background, studio lighting,
refreshing summer beverage commercial
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 선명한 오렌지 주스 잔에 얼음이 떨어지며 액체가 튀어오르는 슬로우 모션. 물방울이 빛을 받아 반짝이고, 옆에 신선한 오렌지 슬라이스. 여름 음료 광고. |
| 추천 스타일 | 광고 |
| 추천 길이 | 3~4초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, unnatural liquid, distorted glass, low quality, static` |

---

### 도시/건축 (5개)

---

**#21. 도쿄 시부야 스크램블**

```
High angle wide shot of the famous Shibuya scramble crossing in Tokyo at
night, hundreds of people crossing in all directions, bright neon signs and
LED billboards glowing, reflections on wet pavement after rain, bustling
metropolitan energy, time-lapse speed
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 비 온 뒤 도쿄 시부야 스크램블 교차로를 위에서 내려다본 야경. 수백 명이 사방으로 건너고, 네온 간판이 빛나며, 젖은 도로에 반사되는 빛. 타임랩스. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, empty street, daytime, low quality, distorted` |

---

**#22. 미래 도시**

```
Slow aerial flythrough of a futuristic city with towering glass skyscrapers,
flying vehicles between buildings, holographic advertisements floating in
the air, blue and purple neon lighting, cyberpunk atmosphere, rain-slicked
surfaces reflecting lights, sci-fi cinematic
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 거대한 유리 마천루 사이를 날아가는 미래 도시 항공 촬영. 빌딩 사이로 날아다니는 차량, 공중 홀로그램 광고, 사이버펑크 네온 빛의 비 젖은 도시. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, low quality, distorted buildings, medieval, natural` |

---

**#23. 한옥 마을**

```
Smooth drone shot gliding over traditional Korean hanok village rooftops,
curved dark tile roofs with wooden structures, autumn trees with red and
golden leaves surrounding the village, morning mist rising, traditional and
tranquil, warm natural light
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 한옥 마을 지붕 위를 드론이 부드럽게 지나가며 촬영. 곡선의 어두운 기와지붕과 나무 구조물, 주변을 감싸는 가을 단풍, 아침 안개가 피어오르는 전통적 풍경. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, modern buildings, cars, distorted, low quality` |

---

**#24. 뉴욕 타임스퀘어**

```
First-person POV walking through Times Square in New York City at night,
massive LED billboards and bright lights surrounding on all sides, yellow
taxi cabs passing by, steam rising from street grates, vibrant urban energy,
immersive and dynamic
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 밤의 뉴욕 타임스퀘어를 1인칭 시점으로 걸어가는 영상. 사방의 거대한 LED 빌보드, 지나가는 노란 택시, 하수구에서 올라오는 수증기, 활기찬 도시 에너지. |
| 추천 스타일 | 브이로그 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, empty street, daytime, distorted, low quality` |

---

**#25. 고딕 성당 내부**

```
Slow tilt up inside a grand Gothic cathedral, massive stone columns rising to
vaulted ceilings, colorful stained glass windows with light streaming through
creating patterns on the floor, dust particles floating in beams of light,
reverent and awe-inspiring, deep rich tones
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 웅장한 고딕 성당 내부를 아래에서 위로 천천히 틸트업. 거대한 석조 기둥, 스테인드글라스를 통과한 빛이 바닥에 패턴을 만들고, 빛줄기 속 먼지 입자. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, modern interior, distorted architecture, low quality` |

---

### 추상/아트 (5개)

---

**#26. 잉크 드롭 아트**

```
Extreme close-up of vibrant colored ink drops falling into clear water in
slow motion, swirling and blooming into organic abstract shapes, deep reds
and blues mixing and spreading, black background, mesmerizing fluid dynamics,
macro photography style
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 맑은 물에 선명한 색 잉크가 떨어져 슬로우 모션으로 퍼지는 극접사. 빨강과 파랑이 섞이며 유기적 추상 형태를 만드는 매혹적 유체 역학. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 3~4초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, low quality, muddy colors, static, distorted` |

---

**#27. 네온 기하학**

```
Abstract animation of glowing neon geometric shapes — cubes, spheres, and
triangles — floating and rotating in a dark void, pulsing with vibrant pink,
cyan, and purple light, reflective surfaces, synthwave aesthetic, smooth
looping motion
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 어두운 공간에서 네온 핑크/사이언/퍼플로 빛나는 기하학적 도형들이 떠다니며 회전하는 추상 애니메이션. 신스웨이브 미학. |
| 추천 스타일 | 애니메이션 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, low quality, realistic, natural, distorted shapes` |

---

**#28. 프랙탈 줌**

```
Infinite zoom into a kaleidoscopic fractal pattern, ever-evolving symmetrical
shapes with iridescent colors shifting from gold to turquoise to violet,
hypnotic and meditative, smooth continuous motion, psychedelic abstract art,
high detail
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 만화경 같은 프랙탈 패턴 속으로 끝없이 줌인하는 영상. 금색에서 터콰이즈, 바이올렛으로 변하는 무지개빛 대칭 형태. 최면적이고 명상적. |
| 추천 스타일 | 애니메이션 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, low quality, static, choppy, realistic` |

---

**#29. 빛의 파티클**

```
Thousands of tiny golden light particles swirling and converging to form a
human silhouette in slow motion, dark background, the figure slowly raising
its arms, particles trailing and sparkling, ethereal and magical, cinematic
volumetric lighting
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 수천 개의 금빛 입자가 소용돌이치며 인간 실루엣을 형성하는 슬로우 모션. 형상이 천천히 팔을 들어올리고, 입자들이 반짝이며 흩어지는 신비로운 장면. |
| 추천 스타일 | 시네마틱 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, low quality, static, realistic person, distorted` |

---

**#30. 수묵화 애니메이션**

```
East Asian ink wash painting animation of a dragon emerging from swirling
clouds above misty mountains, black ink brush strokes flowing and forming on
rice paper texture, traditional sumi-e style with minimal color accents in
red, graceful and powerful, smooth flowing motion
```

| 항목 | 설정 |
|------|------|
| 한국어 설명 | 산수 위 구름 속에서 용이 나타나는 수묵화 애니메이션. 먹물 붓터치가 흘러가며 형태를 만들고, 한지 질감 위에 빨간 포인트. 동양적이고 우아한 움직임. |
| 추천 스타일 | 애니메이션 |
| 추천 길이 | 4~5초 |
| 추천 해상도 | 720p |
| 네거티브 | `blurry, watermark, low quality, realistic, western art style, colorful, distorted` |

---

## 7. 프롬프트 개선 체크리스트

프롬프트를 VELA에 입력하기 전에 아래 7가지를 확인하세요. 하나라도 빠지면 결과물 품질이 떨어질 수 있습니다.

```
┌─────────────────────────────────────────────────────────────┐
│                  프롬프트 제출 전 체크리스트                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  □ 1. 주체가 명확한가?                                       │
│     → "사람" (X) → "검은 코트를 입은 젊은 남자" (O)            │
│                                                             │
│  □ 2. 동작이 구체적인가?                                      │
│     → "걷다" (X) → "빗속을 천천히 걸어가다" (O)                │
│                                                             │
│  □ 3. 조명/시간대를 지정했는가?                                │
│     → 지정 안 하면 AI가 임의로 결정합니다                       │
│     → "golden hour light" / "neon-lit at night" 등 추가       │
│                                                             │
│  □ 4. 카메라 앵글/움직임을 지정했는가?                          │
│     → "slow dolly in" / "tracking shot" / "aerial drone" 등   │
│     → 영상의 시각적 임팩트에 가장 큰 영향                      │
│                                                             │
│  □ 5. 불필요한 요소를 네거티브에 넣었는가?                      │
│     → 최소한 기본 네거티브 세트는 항상 포함                     │
│     → blurry, low quality, distorted, watermark 등            │
│                                                             │
│  □ 6. 프롬프트가 적정 길이인가?                                │
│     → 2~4문장(30~80단어)이 가장 효과적                        │
│     → 너무 짧으면 AI가 임의 해석, 너무 길면 혼란              │
│                                                             │
│  □ 7. 하나의 장면에 집중하고 있는가?                           │
│     → 5초 영상에는 한 장면만!                                 │
│     → 여러 장면이 필요하면 나눠서 생성                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 체크리스트 활용 예시

**Before (개선 전):**
```
a woman in a city
```
> 너무 짧음. 주체, 동작, 조명, 카메라 모두 부족.

**After (개선 후):**
```
Medium tracking shot of a young woman in a beige trench coat walking through
a rainy city street at night, neon signs reflecting on wet pavement, soft
bokeh lights in background, cinematic moody atmosphere, shallow depth of field
```
> 주체(O), 동작(O), 장소(O), 조명(O), 카메라(O), 분위기(O) 모두 포함!

---

## 8. 흔한 실수 & 해결법

### 실수 1: 너무 짧은 프롬프트

| 문제 | 해결 |
|------|------|
| `a sunset` | 장소, 카메라, 분위기를 추가하세요 |
| **개선 예시** | `Wide shot of a vibrant sunset over a calm ocean, golden and pink clouds reflected in the water, slow zoom out, serene and peaceful, cinematic` |

**왜 문제인가?** AI는 부족한 정보를 랜덤으로 채우기 때문에, 매번 다른 (원치 않는) 결과가 나옵니다.

---

### 실수 2: 모순되는 키워드

| 문제 | 해결 |
|------|------|
| `bright sunny day, dark moody atmosphere` | 밝은 날씨와 어두운 분위기는 충돌합니다 |
| `slow motion, fast-paced action` | 속도 지시가 모순됩니다 |
| **원칙** | 하나의 톤을 정하고 일관되게 유지하세요 |

**자주 겹치는 모순 조합:**
- sunny + moody (밝은 + 어두운)
- static + dynamic (정적 + 역동적)
- minimalist + cluttered (미니멀 + 복잡한)
- vintage + futuristic (레트로 + 미래적)

---

### 실수 3: 한 프롬프트에 여러 장면 담기

| 문제 | 해결 |
|------|------|
| `A woman walks into a cafe, orders coffee, sits down, reads a book, then leaves` | 5초 안에 5가지 동작은 불가능합니다 |
| **원칙** | 한 프롬프트 = 한 장면 = 한 동작 |
| **개선** | 장면 1: 카페에 들어서는 모습 / 장면 2: 커피잔을 들고 마시는 모습 / 장면 3: 책을 읽는 모습 → 따로 생성 후 편집에서 연결 |

---

### 실수 4: 텍스트나 로고를 AI에게 요청

| 문제 | 해결 |
|------|------|
| `"SALE 50%" text appearing on screen` | AI는 정확한 텍스트 생성이 매우 약합니다 |
| **원칙** | 텍스트, 로고, 글자는 프롬프트에 넣지 마세요 |
| **대안** | 깨끗한 배경 영상을 생성 → VELA 편집기에서 텍스트 오버레이 추가 |

---

### 실수 5: 비현실적 기대

| 문제 | 해결 |
|------|------|
| AI에 "아이돌 뮤비 수준" 기대 | 현재 AI는 5초 클립 생성에 최적화. 긴 서사는 여러 클립을 연결해서 만드세요 |
| 특정 실존 인물 요청 | AI는 특정 유명인을 정확히 재현하기 어려움. 외모를 묘사하는 방식으로 접근하세요 |
| 복잡한 물리 시뮬레이션 | 정교한 물 튀기기, 옷감 시뮬레이션 등은 아직 한계가 있음 |

---

### 실수 6: 카메라 키워드를 빼먹음

| 문제 | 해결 |
|------|------|
| 카메라 지시 없는 프롬프트 | AI가 랜덤 앵글을 선택해 매번 다른 느낌 |
| **원칙** | 프롬프트 시작 부분에 카메라 키워드를 넣으면 영상의 일관성이 크게 향상됩니다 |
| **최소한 이것만이라도** | 구도(close-up/wide shot) + 움직임(static/tracking/pan) |

---

### 실수 7: 네거티브 프롬프트 무시

| 문제 | 해결 |
|------|------|
| 네거티브 없이 생성 | 워터마크, 블러, 왜곡 등이 랜덤으로 나타날 수 있음 |
| **원칙** | 기본 네거티브 세트는 항상 넣으세요 |
| **기본 세트** | `blurry, low quality, distorted, watermark, text overlay, choppy motion` |

---

> **마지막 조언:** 좋은 프롬프트는 한 번에 완성되지 않습니다. 처음에는 이 가이드의 템플릿을 그대로 사용하고, 결과를 보면서 한두 단어씩 바꿔가며 자신만의 스타일을 찾아가세요. 그 과정 자체가 AI 영상 제작의 핵심 스킬입니다.
