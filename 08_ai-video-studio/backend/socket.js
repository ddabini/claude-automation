/**
 * ============================================
 * Socket.io 실시간 통신 관리자
 * ============================================
 *
 * WebSocket을 통해 프론트엔드와 실시간으로 데이터를 주고받습니다.
 * 예: 영상 생성 진행률을 실시간으로 보여주기
 *
 * 비유: 전화 통화처럼 서버↔클라이언트가 계속 연결되어 있어서
 *       새로운 소식이 생기면 바로 전달할 수 있습니다.
 */

const { v4: uuidv4 } = require('uuid');

// 연결된 클라이언트 목록 (clientId → socket 매핑)
const connectedClients = new Map();

// job과 client를 연결하는 매핑 (jobId → clientId)
const jobClientMap = new Map();

/**
 * Socket.io 서버 초기화
 * @param {import('socket.io').Server} io - Socket.io 서버 인스턴스
 */
function initSocket(io) {
  io.on('connection', (socket) => {
    // 새 클라이언트에게 고유 ID 부여 (기존 ID가 있으면 재사용)
    const clientId = socket.handshake.query.clientId || uuidv4();

    // 클라이언트 등록
    connectedClients.set(clientId, socket);
    console.log(`[Socket] 클라이언트 연결: ${clientId} (현재 ${connectedClients.size}명)`);

    // 클라이언트에게 할당된 ID 전송
    socket.emit('connected', { clientId });

    // ── 클라이언트가 특정 job을 구독 (진행률 받기) ──
    socket.on('subscribe:job', (data) => {
      const { jobId } = data;
      if (jobId) {
        jobClientMap.set(jobId, clientId);
        // 해당 job 전용 방에 입장
        socket.join(`job:${jobId}`);
        console.log(`[Socket] ${clientId}가 job ${jobId} 구독`);
      }
    });

    // ── 연결 해제 시 정리 ──
    socket.on('disconnect', () => {
      connectedClients.delete(clientId);
      console.log(`[Socket] 클라이언트 연결 해제: ${clientId} (남은 ${connectedClients.size}명)`);
    });
  });
}

/**
 * 특정 job의 진행률을 구독 중인 클라이언트에게 전송
 * @param {import('socket.io').Server} io - Socket.io 서버
 * @param {string} jobId - 작업 ID
 * @param {number} progress - 진행률 (0~100)
 * @param {string} message - 상태 메시지
 */
function emitProgress(io, jobId, progress, message) {
  io.to(`job:${jobId}`).emit('generation:progress', {
    jobId,
    progress,
    message,
    timestamp: Date.now(),
  });
}

/**
 * 작업 완료 알림
 * @param {import('socket.io').Server} io - Socket.io 서버
 * @param {string} jobId - 작업 ID
 * @param {string} resultUrl - 결과 영상 URL
 */
function emitComplete(io, jobId, resultUrl) {
  io.to(`job:${jobId}`).emit('generation:complete', {
    jobId,
    resultUrl,
    timestamp: Date.now(),
  });

  // job-client 매핑 정리
  jobClientMap.delete(jobId);
}

/**
 * 작업 에러 알림
 * @param {import('socket.io').Server} io - Socket.io 서버
 * @param {string} jobId - 작업 ID
 * @param {string} error - 에러 메시지
 */
function emitError(io, jobId, error) {
  io.to(`job:${jobId}`).emit('generation:error', {
    jobId,
    error,
    timestamp: Date.now(),
  });

  // job-client 매핑 정리
  jobClientMap.delete(jobId);
}

module.exports = {
  initSocket,
  emitProgress,
  emitComplete,
  emitError,
  connectedClients,
  jobClientMap,
};
