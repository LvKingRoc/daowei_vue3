/**
 * 用户偏好设置缓存工具
 * 使用 localStorage 持久化用户偏好
 */

const PREFERENCES_KEY = 'daowei_user_preferences';

// 默认偏好设置
const defaultPreferences = {
  // 主题设置
  theme: 'light',
  
  // 列表显示设置
  pageSize: 20,
  listView: 'card', // 'card' | 'list'
  
  // 搜索设置
  rememberSearch: true,
  lastSearchKeyword: '',
  
  // 表格设置
  tableCompact: false,
  
  // 其他设置
  autoRefresh: false,
  refreshInterval: 30000
};

/**
 * 获取所有偏好设置
 */
export const getPreferences = () => {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('读取用户偏好失败:', e);
  }
  return { ...defaultPreferences };
};

/**
 * 保存偏好设置
 */
export const savePreferences = (preferences) => {
  try {
    const current = getPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.warn('保存用户偏好失败:', e);
    return false;
  }
};

/**
 * 获取单个偏好值
 */
export const getPreference = (key) => {
  const prefs = getPreferences();
  return prefs[key] ?? defaultPreferences[key];
};

/**
 * 设置单个偏好值
 */
export const setPreference = (key, value) => {
  return savePreferences({ [key]: value });
};

/**
 * 重置偏好设置
 */
export const resetPreferences = () => {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(defaultPreferences));
    return true;
  } catch (e) {
    console.warn('重置用户偏好失败:', e);
    return false;
  }
};

/**
 * 清除偏好设置
 */
export const clearPreferences = () => {
  try {
    localStorage.removeItem(PREFERENCES_KEY);
    return true;
  } catch (e) {
    console.warn('清除用户偏好失败:', e);
    return false;
  }
};

export default {
  getPreferences,
  savePreferences,
  getPreference,
  setPreference,
  resetPreferences,
  clearPreferences
};
