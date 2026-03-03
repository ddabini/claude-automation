# Pikbox

디자인 레퍼런스 이미지를 카테고리별로 수집·관리하고, AI로 유사 이미지를 자동 검색하는 도구.

## 실행 방법

### 1. Supabase 설정

#### 1-1. 프로젝트 생성
1. [supabase.com](https://supabase.com) 접속 → 로그인
2. New Project → 프로젝트 이름, 비밀번호, 리전 설정 → Create

#### 1-2. 테이블 생성
프로젝트 대시보드 → SQL Editor → 아래 SQL 실행:

```sql
-- 카테고리 테이블
CREATE TABLE ref_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 이미지 테이블
CREATE TABLE ref_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES ref_categories(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('uploaded', 'collected')),
  title TEXT,
  source_url TEXT,
  image_url TEXT NOT NULL,
  platform TEXT,
  keywords TEXT[],
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ref_images_category ON ref_images(category_id);

-- RLS 설정 (개인 도구 — 전체 허용)
ALTER TABLE ref_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON ref_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ref_images FOR ALL USING (true) WITH CHECK (true);
```

#### 1-3. Storage 버킷 생성
1. 좌측 메뉴 → Storage
2. New Bucket → 이름: `reference-images`
3. Public bucket: ON (체크)
4. File size limit: 10MB
5. Allowed MIME types: `image/*`
6. 생성 후 → Policies 탭 → New Policy → "Allow all" 선택 → 모든 작업 허용

#### 1-4. API 키 확인
프로젝트 Settings → API:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon / public key**: `eyJhbGci...` (JWT 형식, `sb_publishable_` 아님!)

### 2. Gemini API 키 발급

1. [aistudio.google.com](https://aistudio.google.com) 접속
2. Get API Key → Create API Key
3. `AIzaSy...` 형식의 키 복사

### 3. Serper.dev API 키 발급

1. [serper.dev](https://serper.dev) 접속 → 회원가입 (Google 로그인 또는 이메일)
2. Dashboard → API Keys → Default key 복사
3. 월 **2,500회 무료** (Google 이미지 검색 결과를 JSON으로 반환)

### 4. 앱 실행

1. `파일/pikbox.html`을 브라우저에서 열기
2. 설정 모달에서 API 키 입력 → 저장 (Serper API Key 필수, Unsplash/Pexels 선택)
3. 카테고리 생성 → 이미지 업로드 → 사용 시작

## 주요 기능

| 기능 | 설명 |
|------|------|
| 카테고리 관리 | 색상별 카테고리 CRUD (우클릭 메뉴) |
| 이미지 업로드 | 드래그앤드롭 또는 클릭으로 업로드 |
| Run (AI 검색) | 키워드·업종·유형 기반 → Serper.dev 이미지 검색 |
| 멀티선택 | 여러 이미지 일괄 이동/삭제 |
| 에이전트 내보내기 | MD 파일로 다운로드 → archiver 에이전트 연동 |

## 에이전트 연동

[에이전트 내보내기] 버튼으로 다운로드한 MD 파일을 `클로드/[프로젝트명]/레퍼런스/` 폴더에 저장하면,
design-reference-archiver 에이전트가 시드 데이터로 활용합니다.

## 비용 참고

| API | 무료 한도 | 초과 시 |
|-----|----------|---------|
| Supabase | 500MB DB, 1GB Storage | 유료 플랜 |
| Gemini 1.5 Flash | 무료 티어 넉넉 | 사용량 기반 |
| Serper.dev | 월 2,500회 무료 | $50/50,000회 |
