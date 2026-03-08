# 003 내적댄스

카테고리: B (혼자 일상) + C (바이럴 포텐셜)
시리즈: 현대곰이 자주 겪는 기이현상
길이 목표: Shorts 30~45초 / 풀버전 50초~1분

## 콘셉트
쇼미더머니를 보는 빡곰. 겉으로는 소파에 무표정으로 앉아있는데,
속마음은 힙합 무대 위에서 폭발하는 솔로 콘서트.
엔딩에 유일한 외부 반응 = 작은 꼬리 + 귀 한쪽 움찔.

## 제목
- **내적댄스** (추천 — 4글자, 직장인 공감)
- 겉곰속곰 (겉바속촉 패러디)
- 혼자콘서트

## 장면 구성

| # | 환경 | 행동 | 대사 | 감정 | 초 |
|---|------|------|------|------|-----|
| 1 | ENV-01 소파 | 소파에 앉아 리모컨으로 TV 켬 | — | 무표정 | 3초 |
| 2 | ENV-01 소파 | TV(쇼미더머니) 멍하니 바라봄 | "..." | 무표정 | 4초 |
| 3 | 상상 속 무대 | 마이크 들고 래퍼 포즈, 무대 조명 | ♪ | 열광 | 5초 |
| 4 | 상상 속 무대 | 관객 환호 속 손 번쩍, 바운스 | ♪♪♪ | 폭발 | 5초 |
| 5 | ENV-01 소파 | 컷백 — 여전히 무표정 앉아있음 | "...괜찮은 프로그램이네" | 무표정 | 4초 |
| 6 | ENV-01 소파 뒷모습 | 꼬리 미세 움찔 + 귀 한쪽 떨림 | — | 미세 흥분 | 3초 |

## 자막/대사
- S2: (자막 없음 — TV 소리만)
- S3~S4: (상상 장면이므로 자막 없이 음악만 — 또는 "🔥" 이모지 자막)
- S5: "...괜찮은 프로그램이네"
- S6: (자막 없음 — 꼬리+귀만 보여줌)

## 음향 노트
- S1~S2: TV에서 힙합 비트 작게 흘러나옴
- S3~S4: 비트 폭발 + 관객 환호 (쇼미더머니 무대 분위기)
- S5: 비트 뚝 끊김 → 조용한 거실 소리 (시계, 에어컨)
- S6: 짧은 "삐릿" 효과음 (귀 떨릴 때)

## 프롬프트 노트
- 슬로우모션 방지: "quick snappy movements, real-time speed"
- 카메라 응시 방지 (S1~S2): "eyes fixed on TV screen, never looks at camera"
- 상상 장면(S3~S4)은 색감/조명이 확 달라야 함 (네온, 스모그, 무대 조명)
- 엔딩(S6)은 뒷모습 클로즈업 — 꼬리와 귀만 보이게

## I2V 영상 프롬프트

### S1-S2: 소파에서 TV 보기 (시작이미지: bbakgom-smtm-sofa-blank.png)
```
The baby polar bear sits completely still on the sofa, eyes fixed on the TV screen showing a hip-hop show. Absolutely no body movement — only the TV light flickers and changes color on the bear's face. The bear blinks once slowly, mouth stays closed, completely emotionless expression. Warm living room ambient light, TV glow shifting between purple and blue. Static camera, no camera movement, real-time speed.
```

### S3-S4: 상상 속 무대 (시작이미지: bbakgom-smtm-stage-rap.png)
```
The baby polar bear on a hip-hop concert stage bounces energetically to the beat, holding a microphone, mouth opening and closing as if rapping with intense passion. The bear jumps slightly, waves one paw in the air, full of energy. Dramatic neon spotlights sweep across the stage, confetti falls, fog machines create atmospheric haze, crowd silhouettes cheer with raised hands. Dynamic concert lighting, quick snappy movements, real-time speed, energetic vibrant mood, never looks at camera.
```

### S6: 엔딩 꼬리+귀 움찔 (시작이미지: bbakgom-smtm-ending-back.png)
```
The baby polar bear sits motionless on the sofa, seen from behind. After a brief moment of stillness, the tiny round tail twitches once subtly, then the right ear flicks once — a tiny involuntary movement betraying hidden excitement. The rest of the body remains completely still. Warm cozy living room lighting, TV glow from the front. Static camera from behind, no camera movement, real-time speed, subtle movement only.
```

## 시작 이미지 목록
| 파일 | 장면 | 상태 |
|------|------|------|
| bbakgom-smtm-sofa-blank.png | S1-S2 소파 무표정 | ✅ 완료 |
| bbakgom-smtm-stage-rap.png | S3-S4 상상 무대 | ✅ 완료 |
| bbakgom-smtm-ending-back.png | S6 엔딩 뒷모습 | ✅ 완료 |
