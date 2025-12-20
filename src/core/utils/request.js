// @ts-nocheck
import axios from 'axios';
import { getApiBase, REQUEST_CONFIG } from '@/config/env';
import ResponseHandler from './ResponseHandler';
// 动态获取router，支持PC和MP双端
let router = null;
const getRouter = async () => {
  if (router) return router;
  // 根据当前路径判断是PC还是MP
  const isMobile = window.location.pathname.startsWith('/user') || 
                   window.location.pathname.startsWith('/admin') ||
                   window.location.pathname === '/login' ||
                   window.location.pathname === '/';
  try {
    if (isMobile) {
      const module = await import('@/mp/router');
      router = module.default;
    } else {
      const module = await import('@/pc/router');
      router = module.default;
    }
  } catch (e) {
    // 降级处理：使用location跳转
    console.warn('Router import failed, using location redirect');
  }
  return router;
};

// 创建 axios 实例
const service = axios.create({
  baseURL: getApiBase(),
  timeout: REQUEST_CONFIG.TIMEOUT
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    // 例如：添加请求头
    const token = localStorage.getItem('token');
    if (token) {
      // 可以添加 token 有效性检查逻辑
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 处理请求错误
    ResponseHandler.showError('网络请求失败，请检查网络连接');
    return Promise.reject(error);
  }
);

// 显示消息（自动适配PC/MP端）
const showMessage = (message, type = 'error') => {
  // 动态导入消息组件
  const isMobile = window.innerWidth <= 768 || /Mobile|Android|iPhone/i.test(navigator.userAgent);
  if (isMobile) {
    import('vant').then(({ showToast, showDialog }) => {
      if (type === 'error' && message.includes('登录')) {
        showDialog({ title: '提示', message, confirmButtonText: '确定' });
      } else {
        showToast({ message, type: type === 'error' ? 'fail' : 'success' });
      }
    }).catch(() => alert(message));
  } else {
    import('element-plus').then(({ ElMessage, ElMessageBox }) => {
      if (type === 'error' && message.includes('登录')) {
        ElMessageBox.alert(message, '提示', { type: 'warning' });
      } else {
        ElMessage({ message, type, duration: 3000 });
      }
    }).catch(() => alert(message));
  }
};

import { clearAuthData, getLoginPath } from '@/core/utils/authUtils';

// 处理认证错误并跳转
const handleAuthError = (message, reason) => {
  const currentRole = localStorage.getItem('role') || 'user';
  clearAuthData();  // 使用统一的清除函数
  
  // 显示错误消息
  showMessage(message, 'error');
  
  const redirectPath = currentRole === 'admin' ? '/admin/login' : '/login';
  const currentPath = window.location.pathname;
  
  // 确保不在登录页时才跳转
  if (currentPath !== redirectPath && !currentPath.includes('/login')) {
    setTimeout(() => {
      getRouter().then(r => {
        if (r) {
          r.push({
            path: redirectPath,
            query: { redirect: currentPath + window.location.search, reason }
          }).catch(() => window.location.href = redirectPath);
        } else {
          window.location.href = redirectPath;
        }
      });
    }, 1500); // 延迟跳转，让用户看到提示
  }
};

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      const apiResponse = response.data;
      if (apiResponse.success !== undefined && apiResponse.code !== undefined) {
        return apiResponse;
      }
      return { success: true, message: '请求成功', data: response.data, code: 200 };
    }
    return { success: true, message: '请求成功', data: response.data, code: 200 };
  },
  (error) => {
    let errorResponse;

    if (error.response) {
      const status = error.response.status;
      const customCode = error.response.data?.code;
      let message = '请求失败';
      let shouldRedirect = false;
      let reason = '';

      // 处理自定义错误码
      if (customCode === 4011) {
        message = '您的账号已在其他设备登录，当前会话已失效';
        shouldRedirect = true;
        reason = 'kicked';
      } else if (customCode === 4012) {
        message = '用户不存在或已被删除，请联系管理员';
        shouldRedirect = true;
        reason = 'deleted';
      } else if (customCode === 4013) {
        message = '登录凭证已过期，请重新登录';
        shouldRedirect = true;
        reason = 'expired';
      } else {
        switch (status) {
          case 400:
            message = error.response.data?.message || '请求参数错误';
            break;
          case 401:
            message = '登录已过期，请重新登录';
            shouldRedirect = true;
            reason = 'expired';
            break;
          case 403:
            message = '您没有权限执行此操作';
            break;
          case 404:
            message = '请求的资源不存在';
            break;
          case 500:
            message = '服务器错误，请稍后再试';
            break;
          default:
            message = error.response.data?.message || `请求失败(${status})`;
        }
      }

      // 处理需要重定向的认证错误
      if (shouldRedirect) {
        handleAuthError(message, reason);
      }

      errorResponse = {
        success: false,
        message: error.response.data?.message || message,
        data: null,
        code: customCode || status
      };
    } else if (error.request) {
      errorResponse = {
        success: false,
        message: '网络连接失败，请检查网络后重试',
        data: null,
        code: 0
      };
    } else {
      errorResponse = {
        success: false,
        message: error.message || '未知错误',
        data: null,
        code: 0
      };
    }

    return Promise.reject(errorResponse);
  }
);

// 导出请求方法（纯 JavaScript 写法）
const request = {
  get(url, params) {
    return service.get(url, { params });
  },
  post(url, data) {
    return service.post(url, data);
  },
  put(url, data) {
    return service.put(url, data);
  },
  delete(url, params) {
    return service.delete(url, { params });
  }
};

export default request;