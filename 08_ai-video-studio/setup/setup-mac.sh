#!/bin/bash
# ============================================
# VELA 로컬 AI 도구 설치 스크립트 (M1/M2/M3 Mac용)
# ============================================
#
# 이 스크립트는 VELA 플랫폼에 필요한 로컬 AI 도구들을
# Mac에 자동으로 설치합니다.
#
# 사용법:
#   chmod +x setup-mac.sh   ← 실행 권한 부여 (최초 1회)
#   ./setup-mac.sh          ← 실행
#
# 설치 항목:
#   1. Homebrew (Mac용 패키지 관리자)
#   2. Xcode Command Line Tools (개발 도구 기본)
#   3. FFmpeg (영상 처리 엔진)
#   4. Python 3.11+ (AI 도구 실행)
#   5. whisper.cpp (M1 최적화 음성인식)
#   6. faster-whisper (파이썬 기반 음성인식 — 대안)
#   7. rembg (AI 배경 제거)
#   8. Node.js 18+ (백엔드 서버)
#
# 참고: 이미 설치된 도구는 건너뜁니다 (중복 설치 방지)
# ============================================

# --- 색깔 있는 출력을 위한 설정 ---
# (터미널에서 보기 좋게 색깔을 입혀줍니다)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'  # 색깔 리셋 (No Color)

# --- 메시지 출력 함수들 ---
info() {
    echo -e "${BLUE}[정보]${NC} $1"
}

success() {
    echo -e "${GREEN}[완료]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[주의]${NC} $1"
}

error() {
    echo -e "${RED}[오류]${NC} $1"
}

step() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================
# 시작 안내
# ============================================
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                ║${NC}"
echo -e "${CYAN}║     VELA — 로컬 AI 도구 설치 스크립트         ║${NC}"
echo -e "${CYAN}║     AI 영상 제작 플랫폼용 (M1/M2/M3 Mac)     ║${NC}"
echo -e "${CYAN}║                                                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# --- Mac인지 확인 ---
if [[ "$(uname)" != "Darwin" ]]; then
    error "이 스크립트는 macOS에서만 실행할 수 있습니다."
    exit 1
fi

# --- Apple Silicon인지 확인 ---
ARCH=$(uname -m)
if [[ "$ARCH" == "arm64" ]]; then
    success "Apple Silicon (M1/M2/M3) Mac 감지됨"
else
    warn "Intel Mac 감지됨 — 일부 최적화가 적용되지 않을 수 있습니다"
fi

# ============================================
# 1. Homebrew 설치
# ============================================
# Homebrew: Mac에서 프로그램을 쉽게 설치/관리하는 도구
# (App Store처럼 터미널에서 프로그램을 설치할 수 있게 해줍니다)
step "1/8. Homebrew (Mac 패키지 관리자)"

if command -v brew &> /dev/null; then
    success "Homebrew가 이미 설치되어 있습니다: $(brew --version | head -1)"
else
    info "Homebrew 설치 중... (비밀번호를 물어볼 수 있습니다)"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Apple Silicon Mac은 /opt/homebrew에 설치됨
    if [[ "$ARCH" == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi

    if command -v brew &> /dev/null; then
        success "Homebrew 설치 완료"
    else
        error "Homebrew 설치 실패. 수동 설치: https://brew.sh"
        exit 1
    fi
fi

# ============================================
# 2. Xcode Command Line Tools
# ============================================
# 컴파일러, git 등 개발에 필요한 기본 도구 모음
# (whisper.cpp를 빌드하려면 반드시 필요합니다)
step "2/8. Xcode Command Line Tools (개발 도구)"

if xcode-select -p &> /dev/null; then
    success "Xcode Command Line Tools가 이미 설치되어 있습니다"
else
    info "Xcode Command Line Tools 설치 중... (팝업이 뜨면 '설치' 클릭)"
    xcode-select --install
    # 설치 완료될 때까지 대기
    info "설치 팝업에서 '설치' 버튼을 클릭해주세요. 완료 후 Enter를 눌러주세요..."
    read -p ""
fi

# ============================================
# 3. FFmpeg 설치
# ============================================
# FFmpeg: 영상/오디오 처리의 산업 표준 도구
# YouTube, Netflix도 내부적으로 FFmpeg을 사용합니다
# VELA에서는 영상 합성, 자막 인코딩, 포맷 변환에 사용
step "3/8. FFmpeg (영상 처리 엔진)"

if command -v ffmpeg &> /dev/null; then
    FFMPEG_VER=$(ffmpeg -version | head -1 | awk '{print $3}')
    success "FFmpeg가 이미 설치되어 있습니다: v${FFMPEG_VER}"
else
    info "FFmpeg 설치 중..."
    brew install ffmpeg
    if command -v ffmpeg &> /dev/null; then
        success "FFmpeg 설치 완료: $(ffmpeg -version | head -1 | awk '{print $3}')"
    else
        error "FFmpeg 설치 실패"
    fi
fi

# ============================================
# 4. Python 3.11+ 설치
# ============================================
# Python: AI 도구 대부분이 Python으로 만들어져 있습니다
# 3.11 이상이 필요한 이유: 최신 AI 라이브러리 호환성
step "4/8. Python 3.11+ (AI 도구용)"

# 현재 파이썬 버전 확인
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PY_VER=$(python3 --version 2>&1 | awk '{print $2}')
    PY_MAJOR=$(echo "$PY_VER" | cut -d. -f1)
    PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)

    if [[ "$PY_MAJOR" -ge 3 ]] && [[ "$PY_MINOR" -ge 11 ]]; then
        success "Python이 이미 설치되어 있습니다: v${PY_VER}"
        PYTHON_CMD="python3"
    else
        warn "Python ${PY_VER}이 있지만, 3.11 이상이 필요합니다"
    fi
fi

if [[ -z "$PYTHON_CMD" ]]; then
    info "Python 3.11 설치 중..."
    brew install python@3.11
    # Homebrew로 설치한 Python 경로 설정
    if command -v python3.11 &> /dev/null; then
        PYTHON_CMD="python3.11"
        success "Python 설치 완료: $(python3.11 --version)"
    elif command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
        success "Python 설치 완료: $(python3 --version)"
    else
        error "Python 설치 실패"
    fi
fi

# --- pip 최신 버전으로 업그레이드 ---
# pip: Python 패키지(라이브러리)를 설치하는 도구
if [[ -n "$PYTHON_CMD" ]]; then
    info "pip 업그레이드 중..."
    $PYTHON_CMD -m pip install --upgrade pip --quiet
fi

# ============================================
# 5. whisper.cpp 설치 (M1 최적화 음성인식)
# ============================================
# whisper.cpp: OpenAI Whisper를 C++로 재구현한 버전
# Apple Silicon의 Neural Engine을 활용하여
# 원본 Python 버전보다 3배 이상 빠르게 음성을 텍스트로 변환
step "5/8. whisper.cpp (M1 최적화 음성인식)"

# whisper.cpp 설치 경로
WHISPER_DIR="$HOME/.local/whisper.cpp"

if [[ -f "$WHISPER_DIR/build/bin/whisper-cli" ]]; then
    success "whisper.cpp가 이미 설치되어 있습니다: $WHISPER_DIR"
else
    info "whisper.cpp 설치 중..."

    # cmake 필요 (빌드 도구)
    if ! command -v cmake &> /dev/null; then
        info "cmake 설치 중 (빌드에 필요)..."
        brew install cmake
    fi

    # 소스코드 다운로드
    mkdir -p "$HOME/.local"
    git clone https://github.com/ggml-org/whisper.cpp.git "$WHISPER_DIR" 2>/dev/null

    cd "$WHISPER_DIR"

    # Apple Silicon 최적화 빌드 (Metal + CoreML 활용)
    cmake -B build -DWHISPER_COREML=ON
    cmake --build build --config Release -j$(sysctl -n hw.ncpu)

    if [[ -f "$WHISPER_DIR/build/bin/whisper-cli" ]]; then
        success "whisper.cpp 빌드 완료"

        # 기본 모델 다운로드 (base 모델: 약 150MB, 한국어 OK)
        info "Whisper base 모델 다운로드 중... (약 150MB)"
        bash "$WHISPER_DIR/models/download-ggml-model.sh" base

        success "whisper.cpp 설치 완료"
        info "실행 파일: $WHISPER_DIR/build/bin/whisper-cli"
        info "모델 파일: $WHISPER_DIR/models/ggml-base.bin"
    else
        error "whisper.cpp 빌드 실패"
        warn "대안: 아래 faster-whisper를 대신 사용할 수 있습니다"
    fi
fi

# ============================================
# 6. faster-whisper 설치 (Python 기반 대안)
# ============================================
# faster-whisper: whisper.cpp와 같은 목적이지만 Python으로 실행
# whisper.cpp 빌드가 실패했을 때의 대안으로 함께 설치합니다
step "6/8. faster-whisper (Python 음성인식 — 대안)"

if [[ -n "$PYTHON_CMD" ]]; then
    if $PYTHON_CMD -c "import faster_whisper" 2>/dev/null; then
        success "faster-whisper가 이미 설치되어 있습니다"
    else
        info "faster-whisper 설치 중..."
        $PYTHON_CMD -m pip install faster-whisper --quiet
        if $PYTHON_CMD -c "import faster_whisper" 2>/dev/null; then
            success "faster-whisper 설치 완료"
        else
            warn "faster-whisper 설치 실패 (whisper.cpp가 있으면 괜찮습니다)"
        fi
    fi
fi

# ============================================
# 7. rembg 설치 (AI 배경 제거)
# ============================================
# rembg: AI로 이미지에서 배경을 자동으로 제거하는 도구
# 인물이나 물체만 깔끔하게 오려내줍니다 (누끼 따기)
# 로컬에서 실행하면 API 비용 0원
step "7/8. rembg (AI 배경 제거)"

if [[ -n "$PYTHON_CMD" ]]; then
    if $PYTHON_CMD -c "import rembg" 2>/dev/null; then
        success "rembg가 이미 설치되어 있습니다"
    else
        info "rembg 설치 중... (AI 모델 포함, 시간이 좀 걸립니다)"
        $PYTHON_CMD -m pip install "rembg[cli]" --quiet
        if $PYTHON_CMD -c "import rembg" 2>/dev/null; then
            success "rembg 설치 완료"
            info "사용법: rembg i input.jpg output.png"
        else
            warn "rembg 설치 실패"
        fi
    fi
fi

# ============================================
# 8. Node.js 18+ 설치
# ============================================
# Node.js: VELA 백엔드 서버를 실행하는 데 필요합니다
# 18 이상이 필요한 이유: 최신 JavaScript 기능 + 보안 업데이트
step "8/8. Node.js 18+ (백엔드 서버)"

if command -v node &> /dev/null; then
    NODE_VER=$(node --version)
    NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)

    if [[ "$NODE_MAJOR" -ge 18 ]]; then
        success "Node.js가 이미 설치되어 있습니다: ${NODE_VER}"
    else
        warn "Node.js ${NODE_VER}이 있지만, v18 이상이 필요합니다"
        info "Node.js 최신 LTS 설치 중..."
        brew install node@20
        brew link --overwrite node@20
    fi
else
    info "Node.js 설치 중..."
    brew install node@20
    if command -v node &> /dev/null; then
        success "Node.js 설치 완료: $(node --version)"
    else
        error "Node.js 설치 실패"
    fi
fi

# npm 최신 버전으로 업그레이드
if command -v npm &> /dev/null; then
    info "npm 업그레이드 중..."
    npm install -g npm@latest --quiet 2>/dev/null
fi

# ============================================
# 설치 결과 요약
# ============================================
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          설치 결과 요약                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# 각 도구의 설치 상태를 표시
check_tool() {
    local name=$1
    local cmd=$2
    local ver_cmd=$3

    if command -v "$cmd" &> /dev/null; then
        local ver=$(eval "$ver_cmd" 2>/dev/null)
        echo -e "  ${GREEN}[OK]${NC} $name: $ver"
    else
        echo -e "  ${RED}[--]${NC} $name: 설치되지 않음"
    fi
}

check_tool "Homebrew" "brew" "brew --version | head -1"
check_tool "FFmpeg" "ffmpeg" "ffmpeg -version | head -1 | awk '{print \$3}'"
check_tool "Python" "$PYTHON_CMD" "$PYTHON_CMD --version"
check_tool "Node.js" "node" "node --version"
check_tool "npm" "npm" "npm --version"

# whisper.cpp는 특수 경로에 있으므로 별도 확인
if [[ -f "$HOME/.local/whisper.cpp/build/bin/whisper-cli" ]]; then
    echo -e "  ${GREEN}[OK]${NC} whisper.cpp: $HOME/.local/whisper.cpp/"
else
    echo -e "  ${RED}[--]${NC} whisper.cpp: 설치되지 않음"
fi

# Python 패키지 확인
if [[ -n "$PYTHON_CMD" ]]; then
    if $PYTHON_CMD -c "import faster_whisper" 2>/dev/null; then
        FW_VER=$($PYTHON_CMD -c "import faster_whisper; print(faster_whisper.__version__)" 2>/dev/null || echo "설치됨")
        echo -e "  ${GREEN}[OK]${NC} faster-whisper: $FW_VER"
    else
        echo -e "  ${RED}[--]${NC} faster-whisper: 설치되지 않음"
    fi

    if $PYTHON_CMD -c "import rembg" 2>/dev/null; then
        echo -e "  ${GREEN}[OK]${NC} rembg: 설치됨"
    else
        echo -e "  ${RED}[--]${NC} rembg: 설치되지 않음"
    fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  VELA 로컬 도구 설치가 완료되었습니다!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "다음 단계:"
echo "  1. 백엔드 실행: cd backend && npm install && npm start"
echo "  2. 프론트엔드 실행: cd frontend && npm install && npm run dev"
echo "  3. (선택) RunPod GPU 설정: setup/setup-runpod.md 참고"
echo ""
