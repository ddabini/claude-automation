/**
 * ============================================
 * rembg 배경 제거 서비스
 * ============================================
 *
 * rembg는 이미지에서 배경을 자동으로 제거하는 Python 라이브러리입니다.
 * 사람, 물체 등을 배경에서 깔끔하게 분리해줍니다.
 *
 * 비유: 포토샵의 "배경 지우개" 도구를 AI가 자동으로 해주는 것
 *
 * 설치: pip install rembg[gpu]  (GPU 가속) 또는 pip install rembg (CPU)
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const util = require('util');

const execAsync = util.promisify(exec);

// 출력 파일 저장 경로
const OUTPUTS_DIR = path.join(__dirname, '..', 'outputs');

/**
 * rembg가 설치되어 있는지 확인
 * @returns {Promise<boolean>}
 */
async function checkRembgInstalled() {
  try {
    await execAsync('python3 -c "import rembg" 2>/dev/null');
    return true;
  } catch {
    return false;
  }
}

/**
 * 이미지에서 배경을 제거하는 함수
 *
 * 비유: 사진에서 사람만 남기고 뒤 배경을 투명하게 만드는 것
 *
 * @param {string} imagePath - 원본 이미지 파일 경로
 * @param {object} [options] - 추가 설정
 * @param {string} [options.model] - 사용할 AI 모델 ('u2net', 'isnet-general-use' 등)
 * @param {boolean} [options.alphaMatting] - 알파 매팅 사용 여부 (머리카락 등 섬세한 영역 처리)
 * @returns {Promise<string>} 배경이 제거된 이미지 파일 경로 (.png)
 */
async function removeBackground(imagePath, options = {}) {
  // rembg 설치 확인
  const isInstalled = await checkRembgInstalled();
  if (!isInstalled) {
    throw new Error(
      'rembg가 설치되지 않았습니다.\n\n' +
      '설치 방법:\n' +
      '  pip install rembg          (CPU 버전)\n' +
      '  pip install "rembg[gpu]"   (GPU 가속 버전)\n'
    );
  }

  // 파일 존재 확인
  if (!fs.existsSync(imagePath)) {
    throw new Error(`이미지 파일을 찾을 수 없습니다: ${imagePath}`);
  }

  const { model = 'u2net', alphaMatting = false } = options;

  // 출력 파일명 생성 (배경 제거 결과는 항상 PNG — 투명도 지원)
  const outputFileName = `nobg-${uuidv4()}.png`;
  const outputPath = path.join(OUTPUTS_DIR, outputFileName);

  // Python 스크립트 구성
  const pythonScript = `
import sys
from rembg import remove
from PIL import Image
import io

# 원본 이미지 읽기
input_image = Image.open("${imagePath.replace(/"/g, '\\"')}")

# 배경 제거 실행
output_image = remove(
    input_image,
    ${model !== 'u2net' ? `model_name="${model}",` : ''}
    ${alphaMatting ? 'alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10,' : ''}
)

# 결과 저장 (PNG 형식 — 투명 배경 지원)
output_image.save("${outputPath.replace(/"/g, '\\"')}")
print("OK")
`;

  try {
    console.log(`[rembg] 배경 제거 시작: ${imagePath}`);

    const { stdout, stderr } = await execAsync(
      `python3 -c '${pythonScript.replace(/'/g, "'\\''")}'`,
      {
        timeout: 120000, // 2분 타임아웃 (대용량 이미지 고려)
      }
    );

    if (stderr) {
      console.warn(`[rembg] 경고: ${stderr}`);
    }

    // 결과 파일 존재 확인
    if (!fs.existsSync(outputPath)) {
      throw new Error('배경 제거 결과 파일이 생성되지 않았습니다.');
    }

    console.log(`[rembg] 배경 제거 완료: ${outputPath}`);
    return outputPath;
  } catch (err) {
    throw new Error(`배경 제거 실패: ${err.message}`);
  }
}

/**
 * rembg CLI를 직접 사용하는 대안 함수
 * (Python 스크립트 방식이 안 될 때 폴백으로 사용)
 *
 * @param {string} imagePath - 원본 이미지 경로
 * @returns {Promise<string>} 배경 제거된 이미지 경로
 */
async function removeBackgroundCLI(imagePath, options = {}) {
  const outputFileName = `nobg-${uuidv4()}.png`;
  const outputPath = path.join(OUTPUTS_DIR, outputFileName);

  try {
    // rembg CLI 명령어 실행
    let cmd = `rembg i "${imagePath}" "${outputPath}"`;

    if (options.model && options.model !== 'u2net') {
      cmd += ` -m ${options.model}`;
    }
    if (options.alphaMatting) {
      cmd += ' -a';
    }

    await execAsync(cmd, { timeout: 120000 });

    if (!fs.existsSync(outputPath)) {
      throw new Error('rembg CLI 결과 파일이 생성되지 않았습니다.');
    }

    return outputPath;
  } catch (err) {
    throw new Error(`rembg CLI 실행 실패: ${err.message}`);
  }
}

module.exports = {
  removeBackground,
  removeBackgroundCLI,
  checkRembgInstalled,
};
