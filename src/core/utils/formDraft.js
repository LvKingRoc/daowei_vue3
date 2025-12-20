/**
 * 表单草稿保存工具
 * 自动保存编辑中的表单数据到localStorage
 * 
 * 重要设计原则：
 * 1. 只在"新增"模式下自动恢复草稿
 * 2. "编辑"模式下不恢复草稿，优先使用服务器数据
 * 3. 提交成功后自动清除草稿
 * 4. 草稿带有时间戳，超过24小时自动失效
 */

const DRAFT_PREFIX = 'form_draft_';
const DRAFT_EXPIRY = 24 * 60 * 60 * 1000; // 24小时过期

/**
 * 生成草稿存储key
 * @param {string} formName - 表单名称（如 'sample', 'order', 'customer'）
 * @param {string} userId - 用户ID（区分不同用户的草稿）
 * @returns {string} 存储key
 */
const getDraftKey = (formName, userId = '') => {
  return `${DRAFT_PREFIX}${formName}_${userId}`;
};

/**
 * 保存草稿
 * @param {string} formName - 表单名称
 * @param {object} formData - 表单数据
 * @param {object} options - 配置选项
 * @param {string} options.userId - 用户ID
 * @param {boolean} options.isEdit - 是否为编辑模式（编辑模式不保存草稿）
 */
export const saveDraft = (formName, formData, options = {}) => {
  const { userId = '', isEdit = false } = options;
  
  // 编辑模式不保存草稿，避免覆盖服务器数据
  if (isEdit) {
    return;
  }
  
  // 检查表单是否有实际内容
  if (!formData || Object.keys(formData).length === 0) {
    return;
  }
  
  // 检查是否所有字段都为空
  const hasContent = Object.values(formData).some(value => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
  
  if (!hasContent) {
    return;
  }
  
  const key = getDraftKey(formName, userId);
  const draft = {
    data: formData,
    timestamp: Date.now(),
    formName
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch (e) {
    console.warn('草稿保存失败:', e);
  }
};

/**
 * 获取草稿
 * @param {string} formName - 表单名称
 * @param {object} options - 配置选项
 * @param {string} options.userId - 用户ID
 * @param {boolean} options.isEdit - 是否为编辑模式
 * @returns {object|null} 草稿数据或null
 */
export const getDraft = (formName, options = {}) => {
  const { userId = '', isEdit = false } = options;
  
  // 编辑模式不返回草稿，优先使用服务器数据
  if (isEdit) {
    return null;
  }
  
  const key = getDraftKey(formName, userId);
  
  try {
    const draftStr = localStorage.getItem(key);
    if (!draftStr) return null;
    
    const draft = JSON.parse(draftStr);
    
    // 检查是否过期
    if (Date.now() - draft.timestamp > DRAFT_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }
    
    return draft.data;
  } catch (e) {
    console.warn('草稿读取失败:', e);
    return null;
  }
};

/**
 * 检查是否有草稿
 * @param {string} formName - 表单名称
 * @param {object} options - 配置选项
 * @returns {boolean} 是否有有效草稿
 */
export const hasDraft = (formName, options = {}) => {
  const { userId = '', isEdit = false } = options;
  
  if (isEdit) return false;
  
  const draft = getDraft(formName, { userId, isEdit: false });
  return draft !== null;
};

/**
 * 获取草稿信息（包含时间戳）
 * @param {string} formName - 表单名称
 * @param {object} options - 配置选项
 * @returns {object|null} 草稿信息
 */
export const getDraftInfo = (formName, options = {}) => {
  const { userId = '' } = options;
  const key = getDraftKey(formName, userId);
  
  try {
    const draftStr = localStorage.getItem(key);
    if (!draftStr) return null;
    
    const draft = JSON.parse(draftStr);
    
    // 检查是否过期
    if (Date.now() - draft.timestamp > DRAFT_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }
    
    return {
      timestamp: draft.timestamp,
      formName: draft.formName,
      timeAgo: getTimeAgo(draft.timestamp)
    };
  } catch (e) {
    return null;
  }
};

/**
 * 清除草稿
 * @param {string} formName - 表单名称
 * @param {object} options - 配置选项
 */
export const clearDraft = (formName, options = {}) => {
  const { userId = '' } = options;
  const key = getDraftKey(formName, userId);
  
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('草稿清除失败:', e);
  }
};

/**
 * 清除所有过期草稿
 */
export const clearExpiredDrafts = () => {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith(DRAFT_PREFIX)) {
        try {
          const draft = JSON.parse(localStorage.getItem(key));
          if (now - draft.timestamp > DRAFT_EXPIRY) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // 解析失败，删除无效数据
          localStorage.removeItem(key);
        }
      }
    });
  } catch (e) {
    console.warn('清除过期草稿失败:', e);
  }
};

/**
 * 格式化时间差
 * @param {number} timestamp - 时间戳
 * @returns {string} 时间差描述
 */
const getTimeAgo = (timestamp) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  return '超过24小时';
};

export default {
  saveDraft,
  getDraft,
  hasDraft,
  getDraftInfo,
  clearDraft,
  clearExpiredDrafts
};
