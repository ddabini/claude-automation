/**
 * ============================================
 * 배경 제거 API 라우트
 * ============================================
 *
 * 이미지에서 배경을 자동으로 제거하는 API입니다.
 *
 * 엔드포인트:
 * POST /api/background/remove — 이미지 배경 제거
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// 서비스 모듈 불러오기
const rembgService = require('../services/rembg');
const { uploadImage } = require('../middleware/upload');

/**
 * POST /api/background/remove
 * 이미지에서 배경을 제거합니다.
 *
 * 비유: 사진에서 사람이나 물체만 남기고
 *       뒤 배경을 투명하게 지워주는 것
 *
 * 요청: multipart/form-data
 * - image: 이미지 파일 (필수, 최대 50MB)
 * - model: AI 모델 선택 (선택, 기본: 'u2net')
 *   - 'u2net': 범용 (가장 빠름)
 *   - 'isnet-general-use': 일반 사물에 최적화
 *   - 'isnet-anime': 애니메이션/일러스트에 최적화
 * - alphaMatting: 정밀 모드 (선택, 기본: false)
 *   - true: 머리카락 같은 섬세한 부분도 깔끔하게 처리 (느림)
 *   - false: 일반 모드 (빠름)
 *
 * 응답:
 * - downloadUrl: 배경 제거된 이미지 다운로드 URL (.png)
 */
router.post('/remove', uploadImage.single('image'), async (req, res) => {
  try {
    // 업로드된 파일 확인
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '이미지 파일을 업로드해주세요.',
      });
    }

    const { model, alphaMatting } = req.body;
    const imagePath = req.file.path;

    console.log(`[Background] 배경 제거 요청: ${req.file.originalname} (모델: ${model || 'u2net'})`);

    // rembg로 배경 제거 실행
    let outputPath;
    try {
      outputPath = await rembgService.removeBackground(imagePath, {
        model: model || 'u2net',
        alphaMatting: alphaMatting === 'true' || alphaMatting === true,
      });
    } catch (primaryErr) {
      // Python 스크립트 방식 실패 시 CLI 방식으로 재시도
      console.warn('[Background] Python 방식 실패, CLI 방식으로 재시도...');
      try {
        outputPath = await rembgService.removeBackgroundCLI(imagePath, {
          model: model || 'u2net',
          alphaMatting: alphaMatting === 'true' || alphaMatting === true,
        });
      } catch (fallbackErr) {
        // 둘 다 실패하면 원래 에러 반환
        throw primaryErr;
      }
    }

    const fileName = path.basename(outputPath);

    // 결과 파일 크기 확인
    const stats = fs.statSync(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`[Background] 배경 제거 완료: ${fileName} (${fileSizeMB}MB)`);

    res.json({
      success: true,
      downloadUrl: `/outputs/${fileName}`,
      fileName,
      fileSize: `${fileSizeMB}MB`,
      originalName: req.file.originalname,
    });
  } catch (err) {
    console.error('[Background] 배경 제거 오류:', err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
