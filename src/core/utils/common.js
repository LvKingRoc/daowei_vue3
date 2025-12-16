/**
 * 道威系统 - 统一工具函数库
 * 提供通用的工具函数，避免重复代码
 */

import dayjs from 'dayjs';

// =====================================================
// 日期处理
// =====================================================

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @param {string} format - 格式，默认 'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的日期时间字符串
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * 获取今天的日期字符串
 * @returns {string} YYYY-MM-DD格式
 */
export const getToday = () => dayjs().format('YYYY-MM-DD');

/**
 * 获取当前日期数组（用于Vant日期选择器）
 * @returns {string[]} [年, 月, 日]
 */
export const getTodayArray = () => {
  const today = new Date();
  return [
    String(today.getFullYear()),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ];
};

// =====================================================
// 字符串处理
// =====================================================

/**
 * 空值显示处理
 * @param {any} value - 值
 * @param {string} defaultText - 默认显示文本
 * @returns {string}
 */
export const emptyText = (value, defaultText = '无') => {
  if (value === null || value === undefined || value === '') {
    return defaultText;
  }
  return String(value);
};

/**
 * 手机号脱敏
 * @param {string} phone - 手机号
 * @returns {string} 脱敏后的手机号
 */
export const maskPhone = (phone) => {
  if (!phone || phone.length < 7) return phone || '';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

/**
 * 身份证号脱敏
 * @param {string} idCard - 身份证号
 * @returns {string} 脱敏后的身份证号
 */
export const maskIdCard = (idCard) => {
  if (!idCard || idCard.length !== 18) return idCard || '';
  return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
};

/**
 * 身份证号格式化显示（加空格）
 * @param {string} idCard - 身份证号
 * @returns {string} 格式化后的身份证号
 */
export const formatIdCard = (idCard) => {
  if (!idCard || idCard.length !== 18) return idCard || '';
  return `${idCard.slice(0, 6)} ${idCard.slice(6, 14)} ${idCard.slice(14)}`;
};

/**
 * 从身份证号获取年龄
 * @param {string} idCard - 身份证号
 * @returns {number} 年龄
 */
export const getAgeFromIdCard = (idCard) => {
  if (!idCard || idCard.length !== 18) return 0;
  const birthYear = parseInt(idCard.substring(6, 10), 10);
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
};

// =====================================================
// 数值处理
// =====================================================

/**
 * 格式化金额
 * @param {number} amount - 金额
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的金额
 */
export const formatAmount = (amount, decimals = 2) => {
  if (amount === null || amount === undefined) return '0.00';
  return Number(amount).toFixed(decimals);
};

/**
 * 格式化数量（带千分位）
 * @param {number} num - 数字
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// =====================================================
// API响应处理
// =====================================================

/**
 * 检查API响应是否成功
 * @param {object} response - API响应
 * @returns {boolean}
 */
export const isApiSuccess = (response) => {
  if (!response || response.success !== true) return false;
  if (response.code === undefined || response.code === null) return true;
  const code = Number(response.code);
  if (Number.isNaN(code)) return true;
  return code >= 200 && code < 300;
};

/**
 * 获取API错误信息
 * @param {object} response - API响应
 * @param {string} defaultMsg - 默认错误信息
 * @returns {string}
 */
export const getApiErrorMsg = (response, defaultMsg = '操作失败') => {
  if (response && response.message) {
    return response.message;
  }
  return defaultMsg;
};

// =====================================================
// 防抖和节流
// =====================================================

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function}
 */
export const debounce = (fn, delay = 300) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

/**
 * 节流函数
 * @param {Function} fn - 要执行的函数
 * @param {number} interval - 间隔时间（毫秒）
 * @returns {Function}
 */
export const throttle = (fn, interval = 300) => {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
};

// =====================================================
// 存储相关
// =====================================================

/**
 * 安全的localStorage获取
 * @param {string} key - 键名
 * @param {any} defaultValue - 默认值
 * @returns {any}
 */
export const getStorage = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    return JSON.parse(value);
  } catch {
    return localStorage.getItem(key) || defaultValue;
  }
};

/**
 * 安全的localStorage设置
 * @param {string} key - 键名
 * @param {any} value - 值
 */
export const setStorage = (key, value) => {
  try {
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('localStorage setItem failed:', e);
  }
};

/**
 * 移除localStorage项
 * @param {string} key - 键名
 */
export const removeStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('localStorage removeItem failed:', e);
  }
};

// =====================================================
// 其他工具
// =====================================================

/**
 * 深拷贝
 * @param {any} obj - 要拷贝的对象
 * @returns {any}
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
};

/**
 * 生成唯一ID
 * @returns {string}
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 睡眠函数
 * @param {number} ms - 毫秒
 * @returns {Promise}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 默认导出所有工具函数
export default {
  formatDate,
  formatDateTime,
  getToday,
  getTodayArray,
  emptyText,
  maskPhone,
  maskIdCard,
  formatIdCard,
  getAgeFromIdCard,
  formatAmount,
  formatNumber,
  isApiSuccess,
  getApiErrorMsg,
  debounce,
  throttle,
  getStorage,
  setStorage,
  removeStorage,
  deepClone,
  generateId,
  sleep
};
