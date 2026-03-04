/**
 * ============================================
 * Whisper 음성 인식 서비스
 * ============================================
 *
 * Whisper는 OpenAI가 만든 음성→텍스트 변환(STT) AI 모델입니다.
 * 영상의 음성을 분석해서 자막을 자동으로 만들어줍니다.
 *
 * 지원 방식:
 * 1. whisper.cpp — C++로 만든 경량 버전 (Mac M1 최적화, 추천)
 * 2. openai-whisper — Python 공식 버전 (설치 간편)
 *
 * 둘 다 설치되지 않은 경우 친절한 에러 메시지를 반환합니다.
 */

const { execFile, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const util = require('util');

const execAsync = util.promisify(exec);

// 환경변수에서 Whisper 설정 읽기
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'base';
const WHISPER_LANGUAGE = process.env.WHISPER_LANGUAGE || 'ko';

// 출력 파일 저장 경로
const OUTPUTS_DIR = path.join(__dirname, '..', 'outputs');

/**
 * 어떤 Whisper가 설치되어 있는지 확인
 * @returns {Promise<'whisper.cpp' | 'openai-whisper' | null>}
 */
async function detectWhisperBackend() {
  // 방법 1: whisper.cpp 확인 (주로 'whisper' 또는 'main' 바이너리)
  try {
    await execAsync('which whisper-cpp 2>/dev/null || which whisper 2>/dev/null');
    return 'whisper.cpp';
  } catch {
    // whisper.cpp 없음
  }

  // 방법 2: Python openai-whisper 확인
  try {
    await execAsync('python3 -c "import whisper" 2>/dev/null');
    return 'openai-whisper';
  } catch {
    // openai-whisper도 없음
  }

  return null;
}

/**
 * 음성 파일을 텍스트로 변환하는 메인 함수
 *
 * 비유: 녹음된 말을 듣고 받아쓰기 해주는 AI 비서
 *
 * @param {string} audioPath - 오디오 파일 경로 (.wav 권장)
 * @param {object} [options] - 추가 설정
 * @param {string} [options.language] - 언어 코드 ('ko', 'en', 'ja')
 * @param {string} [options.model] - 모델 크기 ('tiny', 'base', 'small', 'medium', 'large')
 * @returns {Promise<Array<{ start: number, end: number, text: string }>>}
 *   각 자막 조각의 시작 시간, 끝 시간(초), 텍스트
 */
async function transcribe(audioPath, options = {}) {
  const language = options.language || WHISPER_LANGUAGE;
  const model = options.model || WHISPER_MODEL;

  // 파일 존재 확인
  if (!fs.existsSync(audioPath)) {
    throw new Error(`오디오 파일을 찾을 수 없습니다: ${audioPath}`);
  }

  // 어떤 Whisper가 사용 가능한지 확인
  const backend = await detectWhisperBackend();

  if (!backend) {
    throw new Error(
      'Whisper가 설치되지 않았습니다.\n\n' +
      '아래 방법 중 하나로 설치해주세요:\n\n' +
      '방법 1 (추천 - Mac M1 최적화):\n' +
      '  brew install whisper-cpp\n\n' +
      '방법 2 (Python 공식 버전):\n' +
      '  pip install openai-whisper\n'
    );
  }

  console.log(`[Whisper] 백엔드: ${backend}, 모델: ${model}, 언어: ${language}`);

  if (backend === 'whisper.cpp') {
    return transcribeWithWhisperCpp(audioPath, model, language);
  } else {
    return transcribeWithPythonWhisper(audioPath, model, language);
  }
}

/**
 * whisper.cpp로 음성 인식 실행
 */
async function transcribeWithWhisperCpp(audioPath, model, language) {
  // whisper.cpp는 JSON 출력을 지원
  const outputBase = path.join(OUTPUTS_DIR, `stt-${uuidv4()}`);

  return new Promise((resolve, reject) => {
    // whisper.cpp CLI 명령어 구성
    const args = [
      '-m', `ggml-${model}.bin`,  // 모델 파일
      '-f', audioPath,             // 입력 오디오
      '-l', language,              // 언어
      '-oj',                       // JSON 출력
      '-of', outputBase,           // 출력 파일 경로 (확장자 자동 추가)
    ];

    execFile('whisper-cpp', args, { timeout: 300000 }, (err, stdout, stderr) => {
      if (err) {
        // whisper 명령이 다른 이름일 수 있음
        execFile('whisper', args, { timeout: 300000 }, (err2, stdout2, stderr2) => {
          if (err2) {
            reject(new Error(`whisper.cpp 실행 실패: ${err2.message}\n${stderr2}`));
            return;
          }
          parseWhisperCppOutput(outputBase, resolve, reject);
        });
        return;
      }
      parseWhisperCppOutput(outputBase, resolve, reject);
    });
  });
}

/**
 * whisper.cpp JSON 출력 파싱
 */
function parseWhisperCppOutput(outputBase, resolve, reject) {
  const jsonPath = `${outputBase}.json`;

  try {
    if (fs.existsSync(jsonPath)) {
      const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      // whisper.cpp JSON 형식을 우리 형식으로 변환
      const segments = (raw.transcription || []).map((seg) => ({
        start: parseTimestamp(seg.timestamps?.from || '00:00:00.000'),
        end: parseTimestamp(seg.timestamps?.to || '00:00:00.000'),
        text: (seg.text || '').trim(),
      }));

      // 임시 파일 정리
      try { fs.unlinkSync(jsonPath); } catch {}

      resolve(segments);
    } else {
      reject(new Error('whisper.cpp 출력 파일을 찾을 수 없습니다.'));
    }
  } catch (parseErr) {
    reject(new Error(`whisper.cpp 출력 파싱 실패: ${parseErr.message}`));
  }
}

/**
 * Python openai-whisper로 음성 인식 실행
 */
async function transcribeWithPythonWhisper(audioPath, model, language) {
  // Python 스크립트를 인라인으로 실행
  const pythonScript = `
import whisper
import json
import sys

model = whisper.load_model("${model}")
result = model.transcribe("${audioPath.replace(/"/g, '\\"')}", language="${language}")

segments = []
for seg in result["segments"]:
    segments.append({
        "start": round(seg["start"], 3),
        "end": round(seg["end"], 3),
        "text": seg["text"].strip()
    })

print(json.dumps(segments, ensure_ascii=False))
`;

  try {
    // Python 스크립트 실행 (최대 5분 타임아웃)
    const { stdout, stderr } = await execAsync(
      `python3 -c '${pythonScript.replace(/'/g, "'\\''")}'`,
      { timeout: 300000 }
    );

    if (stderr) {
      console.warn(`[Whisper Python] 경고: ${stderr}`);
    }

    const segments = JSON.parse(stdout.trim());
    return segments;
  } catch (err) {
    throw new Error(`Python Whisper 실행 실패: ${err.message}`);
  }
}

/**
 * 자막 데이터를 SRT 파일로 저장하는 함수
 *
 * SRT는 가장 널리 쓰이는 자막 파일 형식입니다.
 * 형식 예시:
 * 1
 * 00:00:01,000 --> 00:00:03,500
 * 안녕하세요
 *
 * @param {Array<{ start: number, end: number, text: string }>} segments - 자막 데이터
 * @returns {string} 생성된 SRT 파일 경로
 */
function saveSRT(segments) {
  const outputFileName = `subtitle-${uuidv4()}.srt`;
  const outputPath = path.join(OUTPUTS_DIR, outputFileName);

  // SRT 형식으로 변환
  const srtContent = segments
    .map((seg, i) => {
      const startTime = secondsToSRT(seg.start);
      const endTime = secondsToSRT(seg.end);
      return `${i + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
    })
    .join('\n');

  fs.writeFileSync(outputPath, srtContent, 'utf-8');
  console.log(`[Whisper] SRT 파일 저장: ${outputPath}`);

  return outputPath;
}

/**
 * 타임스탬프 문자열을 초 단위로 변환
 * '00:01:30.500' → 90.5
 */
function parseTimestamp(ts) {
  const parts = ts.split(':');
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const seconds = parseFloat(parts[2]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * 초 단위를 SRT 타임스탬프 형식으로 변환
 * 90.5 → '00:01:30,500'
 */
function secondsToSRT(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds % 1) * 1000);

  return (
    String(hours).padStart(2, '0') + ':' +
    String(minutes).padStart(2, '0') + ':' +
    String(seconds).padStart(2, '0') + ',' +
    String(milliseconds).padStart(3, '0')
  );
}

module.exports = {
  transcribe,
  saveSRT,
  detectWhisperBackend,
};
