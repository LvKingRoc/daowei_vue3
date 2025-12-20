/**
 * 心跳检测工具
 * 定期检测token有效性，提前处理过期情况
 */

import { parseJwtPayload, isTokenExpiringSoon, clearAuthAndGetLoginPath } from '@/core/router/guard';

// 心跳间隔（毫秒）
const HEARTBEAT_INTERVAL = 60000; // 1分钟检测一次

// 提前预警时间（毫秒）
const EXPIRY_WARNING_TIME = 5 * 60 * 1000; // 5分钟

let heartbeatTimer = null;
let warningShown = false;

/**
 * 检查token状态
 * @returns {object} { valid: boolean, expiresIn: number, reason: string }
 */
export const checkTokenStatus = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return { valid: false, expiresIn: 0, reason: 'no_token' };
  }
  
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) {
    return { valid: false, expiresIn: 0, reason: 'invalid_token' };
  }
  
  const now = Date.now();
  const expiresAt = payload.exp * 1000;
  const expiresIn = expiresAt - now;
  
  if (expiresIn <= 0) {
    return { valid: false, expiresIn: 0, reason: 'expired' };
  }
  
  if (expiresIn <= EXPIRY_WARNING_TIME) {
    return { valid: true, expiresIn, reason: 'expiring_soon' };
  }
  
  return { valid: true, expiresIn, reason: 'valid' };
};

/**
 * 显示消息（自动适配PC/MP端）
 */
const showMessage = async (message, type = 'warning') => {
  const isMobile = window.innerWidth <= 768 || /Mobile|Android|iPhone/i.test(navigator.userAgent);
  
  if (isMobile) {
    const { showDialog } = await import('vant');
    showDialog({ title: '提示', message, confirmButtonText: '确定' });
  } else {
    const { ElMessageBox } = await import('element-plus');
    ElMessageBox.alert(message, '提示', { type });
  }
};

/**
 * 处理token过期
 */
const handleTokenExpired = (reason) => {
  const role = localStorage.getItem('role') || 'user';
  const loginPath = clearAuthAndGetLoginPath(role);
  
  let message = '登录已过期，请重新登录';
  if (reason === 'expiring_soon') {
    message = '登录即将过期，请重新登录以继续使用';
  }
  
  showMessage(message, 'warning');
  
  setTimeout(() => {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/login')) {
      window.location.href = loginPath + '?reason=expired&redirect=' + encodeURIComponent(currentPath);
    }
  }, 1500);
};

/**
 * 执行心跳检测
 */
const doHeartbeat = () => {
  const status = checkTokenStatus();
  
  if (!status.valid) {
    stopHeartbeat();
    handleTokenExpired(status.reason);
    return;
  }
  
  // 即将过期提醒（只提醒一次）
  if (status.reason === 'expiring_soon' && !warningShown) {
    warningShown = true;
    const minutes = Math.ceil(status.expiresIn / 60000);
    showMessage(`登录将在 ${minutes} 分钟后过期，请及时保存工作`, 'warning');
  }
};

/**
 * 启动心跳检测
 */
export const startHeartbeat = () => {
  if (heartbeatTimer) {
    return; // 已经在运行
  }
  
  warningShown = false;
  
  // 立即检测一次
  doHeartbeat();
  
  // 定时检测
  heartbeatTimer = setInterval(doHeartbeat, HEARTBEAT_INTERVAL);
};

/**
 * 停止心跳检测
 */
export const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  warningShown = false;
};

/**
 * 重置心跳（登录后调用）
 */
export const resetHeartbeat = () => {
  stopHeartbeat();
  startHeartbeat();
};

export default {
  checkTokenStatus,
  startHeartbeat,
  stopHeartbeat,
  resetHeartbeat
};
