/**
 * 环境配置文件
 * 简化版 - 敏感密钥已移至后端
 */

// 环境信息
const ENV = import.meta.env.MODE || 'development';

export const ENVIRONMENT = {
  ENV,
  IS_DEVELOPMENT: ENV === 'development',
  IS_PRODUCTION: ENV === 'production',
  IS_TEST: ENV === 'test'
};

// 服务器配置
const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || '';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '';
const API_BASE_PATH = import.meta.env.VITE_API_BASE_PATH || '/api';

/**
 * 获取后端URL
 * 开发环境返回完整URL，生产环境返回空（使用相对路径）
 */
export const getBackEndUrl = () => {
  if (!BACKEND_HOST) return '';
  const port = BACKEND_PORT ? `:${BACKEND_PORT}` : '';
  return `http://${BACKEND_HOST}${port}`;
};

/**
 * 获取API基础路径
 */
export const getApiBase = () => {
  const backendUrl = getBackEndUrl();
  return backendUrl ? `${backendUrl}${API_BASE_PATH}` : API_BASE_PATH;
};

/**
 * 获取图片完整URL
 */
export const getImageUrl = (path) => {
  if (!path) return '';
  const backendUrl = getBackEndUrl();
  return backendUrl ? `${backendUrl}${path}` : path;
};

/**
 * 后端代理API路径（第三方API通过后端代理访问）
 */
export const PROXY_API = {
  WEATHER: `${API_BASE_PATH}/proxy/weather`,
  CALENDAR: `${API_BASE_PATH}/proxy/calendar`,
  OCR_TOKEN: `${API_BASE_PATH}/proxy/ocr/token`,
  OCR_RECOGNIZE: `${API_BASE_PATH}/proxy/ocr/recognize`,
  CONFIG: `${API_BASE_PATH}/proxy/config`
};

// 请求配置
export const REQUEST_CONFIG = {
  TIMEOUT: 15000,
  RETRY_TIMES: 3,
  RETRY_DELAY: 1000
};

// 默认导出
export default {
  ENVIRONMENT,
  getBackEndUrl,
  getApiBase,
  getImageUrl,
  PROXY_API,
  REQUEST_CONFIG
};
