/**
 * services/socket.ts — Socket.io 실시간 통신 모듈
 *
 * 일반 API 요청은 "물어보면 대답하는" 방식이지만,
 * Socket.io는 "서버가 먼저 소식을 알려주는" 방식입니다.
 *
 * 영상 생성처럼 시간이 오래 걸리는 작업에서 진행률을
 * 실시간으로 받아오는 데 사용합니다.
 *
 * 비유: 택배를 시키고 "지금 어디쯤이에요?" 계속 물어보는 대신,
 *       택배 기사가 "지금 ○○ 지나고 있어요~" 먼저 알려주는 것
 */
import { io, Socket } from 'socket.io-client';

// ─────────────────────────────────────
// 소켓 연결 설정
// ─────────────────────────────────────

/** 소켓 연결 객체 (앱 전체에서 하나만 사용) */
let socket: Socket | null = null;

/**
 * 소켓 서버에 연결합니다.
 * - 이미 연결되어 있으면 기존 연결을 재사용합니다
 * - 연결이 끊기면 자동으로 재연결을 시도합니다
 */
export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  // 소켓 서버 URL (개발 환경에서는 로컬호스트)
  socket = io('http://localhost:4000', {
    // 자동 재연결 설정
    reconnection: true,
    reconnectionAttempts: 5,    // 최대 5회 재시도
    reconnectionDelay: 1000,    // 1초 간격으로 재시도
    // WebSocket 우선 사용 (더 빠름)
    transports: ['websocket', 'polling'],
  });

  // 연결 성공 시 로그
  socket.on('connect', () => {
    console.log('[VELA Socket] 서버에 연결되었습니다');
  });

  // 연결 끊김 시 로그
  socket.on('disconnect', (reason) => {
    console.log('[VELA Socket] 연결이 끊어졌습니다:', reason);
  });

  // 연결 에러 시 로그
  socket.on('connect_error', (error) => {
    console.warn('[VELA Socket] 연결 오류:', error.message);
  });

  return socket;
}

/**
 * 소켓 연결을 종료합니다.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * 특정 영상 생성 작업의 진행률 업데이트를 구독합니다.
 * - jobId에 해당하는 작업의 상태 변화를 실시간으로 받습니다
 * - 서버에서 progress-update 이벤트를 보낼 때마다 콜백 함수가 실행됩니다
 *
 * @param jobId - 구독할 작업 ID
 * @param onUpdate - 상태 업데이트 시 실행할 함수
 * @returns 구독 해제 함수 (더 이상 업데이트를 받지 않으려면 호출)
 */
export function subscribeToJob(
  jobId: string,
  onUpdate: (data: {
    status: string;
    progress: number;
    estimatedSeconds: number;
    resultUrl?: string;
    errorMessage?: string;
  }) => void
): () => void {
  const s = connectSocket();

  // 서버에 "이 작업을 구독하겠다"고 알림
  s.emit('subscribe-job', { jobId });

  // 진행률 업데이트 이벤트 리스너 등록
  const handler = (data: {
    jobId: string;
    status: string;
    progress: number;
    estimatedSeconds: number;
    resultUrl?: string;
    errorMessage?: string;
  }) => {
    // 내가 구독한 작업의 업데이트만 처리
    if (data.jobId === jobId) {
      onUpdate(data);
    }
  };

  s.on('progress-update', handler);

  // 구독 해제 함수를 반환 (컴포넌트가 사라질 때 호출)
  return () => {
    s.off('progress-update', handler);
    s.emit('unsubscribe-job', { jobId });
  };
}
