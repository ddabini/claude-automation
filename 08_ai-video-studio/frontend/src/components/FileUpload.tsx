/**
 * components/FileUpload.tsx — 파일 업로드 컴포넌트 (드래그앤드롭)
 *
 * 파일을 업로드하는 두 가지 방법을 제공합니다:
 * 1. 드래그앤드롭 — 파일을 끌어다 놓기
 * 2. 클릭하여 파일 선택 — 파일 탐색기에서 골라서 올리기
 *
 * 이미지 파일의 경우 업로드 후 미리보기를 보여줍니다.
 */
import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, FileVideo } from 'lucide-react';

// ─────────────────────────────────────
// 컴포넌트 입력값(Props) 정의
// ─────────────────────────────────────

interface FileUploadProps {
  accept: string;                          // 허용할 파일 형식 (예: "image/*", "video/*")
  label: string;                           // 안내 문구 (예: "이미지를 업로드하세요")
  sublabel?: string;                       // 보조 안내 문구
  icon?: 'image' | 'video';               // 아이콘 종류
  file: File | null;                       // 현재 선택된 파일
  onFileSelect: (file: File | null) => void; // 파일이 선택되었을 때 실행할 함수
  maxSizeMB?: number;                      // 최대 파일 크기 (MB)
}

// ─────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────

const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  label,
  sublabel,
  icon = 'image',
  file,
  onFileSelect,
  maxSizeMB = 10,
}) => {
  // 드래그 중인지 여부 (테두리 색상 변경용)
  const [isDragging, setIsDragging] = useState(false);
  // 이미지 미리보기 URL
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // 숨겨진 파일 입력 요소 참조 (클릭 시 파일 선택 대화상자 열기)
  const inputRef = useRef<HTMLInputElement>(null);

  // ── 파일 유효성 검사 + 처리 ──
  const handleFile = useCallback(
    (selectedFile: File) => {
      // 파일 크기 확인 (MB 단위)
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        alert(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
        return;
      }

      onFileSelect(selectedFile);

      // 이미지 파일이면 미리보기 생성
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    },
    [maxSizeMB, onFileSelect]
  );

  // ── 파일 제거 ──
  const handleRemove = () => {
    onFileSelect(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl); // 메모리 정리
      setPreviewUrl(null);
    }
  };

  // ── 드래그앤드롭 이벤트 처리 ──

  /** 파일이 영역 위로 올라왔을 때 — 테두리 강조 */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  /** 파일이 영역 밖으로 나갔을 때 — 테두리 원래대로 */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  /** 파일을 놓았을 때 — 파일 처리 */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  };

  /** 파일 선택 대화상자에서 파일을 골랐을 때 */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  // ── 파일이 선택된 상태 — 미리보기 표시 ──
  if (file) {
    return (
      <div className="relative group">
        {/* 이미지 미리보기가 있으면 보여주기, 없으면 파일명 표시 */}
        {previewUrl ? (
          <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
            <img
              src={previewUrl}
              alt="업로드된 이미지 미리보기"
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-full py-8 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center gap-2">
            <FileVideo className="w-10 h-10 text-gray-400" />
            <p className="text-sm text-gray-600 font-medium">{file.name}</p>
            <p className="text-xs text-gray-400">
              {(file.size / (1024 * 1024)).toFixed(1)}MB
            </p>
          </div>
        )}

        {/* 파일 제거 버튼 (우측 상단) */}
        <button
          onClick={handleRemove}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white
                     flex items-center justify-center opacity-0 group-hover:opacity-100
                     transition-opacity hover:bg-black/70"
          aria-label="파일 제거"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── 파일이 없는 상태 — 업로드 안내 표시 ──
  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-full aspect-video rounded-2xl border-2 border-dashed cursor-pointer
        flex flex-col items-center justify-center gap-4 transition-all duration-200
        ${
          isDragging
            ? 'border-primary-400 bg-primary-50 scale-[1.01]'
            : 'border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/50'
        }
      `}
    >
      {/* 숨겨진 파일 입력 — 클릭 시 대화상자가 열림 */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* 아이콘 */}
      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
        {icon === 'image' ? (
          <ImageIcon className="w-7 h-7 text-primary-400" />
        ) : (
          <Upload className="w-7 h-7 text-primary-400" />
        )}
      </div>

      {/* 안내 문구 */}
      <div className="text-center">
        <p className="text-gray-600 font-medium">{label}</p>
        {sublabel && (
          <p className="text-gray-400 text-sm mt-1">{sublabel}</p>
        )}
        <p className="text-primary-500 text-sm font-medium mt-2">
          파일을 끌어다 놓거나 클릭하여 선택
        </p>
      </div>
    </div>
  );
};

export default FileUpload;
