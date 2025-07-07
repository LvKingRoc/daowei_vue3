// 环境配置文件
// 统一管理所有服务器地址、端口和API密钥

// 环境变量配置
const ENV: string = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE) || 'development';

// 服务器配置
export const SERVER_CONFIG = {
  // 后端服务器配置
  BACKEND_HOST: 'localhost',
  BACKEND_PORT: '8088',
  
  // 前端服务器配置
  FRONTEND_HOST: 'localhost',
  FRONTEND_PORT: '3000',
  
  // API基础路径
  API_BASE_PATH: '/api',
  
  // 百度云API代理路径
  BAIDU_API_PROXY: '/baidu-api'
};

// 构建完整的URL
export const getBackEndUrl = (): string => 
  `http://${SERVER_CONFIG.BACKEND_HOST}:${SERVER_CONFIG.BACKEND_PORT}`;

export const getFrontEndUrl = (): string => 
  `http://${SERVER_CONFIG.FRONTEND_HOST}:${SERVER_CONFIG.FRONTEND_PORT}`;

export const getApiBase = (): string => 
  `${getBackEndUrl()}${SERVER_CONFIG.API_BASE_PATH}`;

// 图片URL生成函数
export const getImageUrl = (image: string): string => {
  if (!image) return '';
  return `${getBackEndUrl()}${image}`;
};

// API密钥配置
export const API_KEYS = {
  // 高德地图天气API密钥
  WEATHER_API_KEY: '8ea6344afc5c76108c94c24d513307c6',
  
  // 百度云OCR API密钥
  BAIDU_OCR: {
    AK: 'R0fzlYwrNSoGqL9MUDnlqM7W',
    SK: 'yglX3oLB76H9ksl2QXuuYpk0sEYs7Iod'
  },
  
  // 日历API密钥
  CALENDAR_API: {
    ID: '88888888',
    KEY: '88888888'
  }
};

// 外部API配置
export const EXTERNAL_APIS = {
  // 高德地图天气API
  WEATHER_API: {
    BASE_URL: 'https://restapi.amap.com/v3/weather/weatherInfo',
    CITY_CODE: '440300' // 深圳市
  },
  
  // 百度云API
  BAIDU_API: {
    BASE_URL: 'https://aip.baidubce.com',
    TOKEN_URL: '/oauth/2.0/token',
    OCR_URL: '/rest/2.0/ocr/v1/accurate_basic'
  },
  
  // 日历API
  CALENDAR_API: {
    BASE_URL: 'https://cn.apihz.cn/api/time/getday.php'
  }
};

// 请求配置
export const REQUEST_CONFIG = {
  TIMEOUT: 5000,
  RETRY_TIMES: 3,
  RETRY_DELAY: 1000
};

// 导出环境信息
export const ENVIRONMENT = {
  ENV,
  IS_DEVELOPMENT: ENV === 'development',
  IS_PRODUCTION: ENV === 'production',
  IS_TEST: ENV === 'test'
};

// 默认配置对象
const config = {
  // 环境信息
  ENV,
  ENVIRONMENT,
  
  // 服务器配置
  SERVER_CONFIG,
  
  // API密钥
  API_KEYS,
  
  // 外部API配置
  EXTERNAL_APIS,
  
  // 请求配置
  REQUEST_CONFIG
};

export default config;
