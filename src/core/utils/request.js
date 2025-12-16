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

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 统一返回ApiResponse格式
    if (response.data && typeof response.data === 'object') {
      // 检查响应格式是否符合ApiResponse
      const apiResponse = response.data;
      if (apiResponse.success !== undefined && apiResponse.code !== undefined) {
        // 对于非成功响应，不在拦截器中显示错误，让组件自行处理
        return apiResponse;
      }

      // 兼容旧格式，转换为ApiResponse格式
      return {
        success: true,
        message: '请求成功',
        data: response.data,
        code: 200
      };
    }

    // 默认成功响应
    return {
      success: true,
      message: '请求成功',
      data: response.data,
      code: 200
    };
  },
  (error) => {
    // 构造错误响应
    let errorResponse;

    if (error.response) {
      // 服务器响应错误
      const status = error.response.status;
      // 检查自定义错误码（如 4011 账号在其他设备登录）
      const customCode = error.response.data?.code;
      let message = '请求失败';

      // 处理 4011 错误码：账号在其他设备登录
      // 处理 4012 错误码：用户不存在或已被删除
      if (customCode === 4011 || customCode === 4012) {
        message = customCode === 4011 
          ? '账号已在其他设备登录，请重新登录' 
          : '用户不存在或已被删除，请重新登录';
        const currentRole = localStorage.getItem('role') || 'user';
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        
        const redirectPath = currentRole === 'admin' ? '/admin/login' : '/login';
        // 异步获取router并跳转
        getRouter().then(r => {
          if (r && r.currentRoute?.value?.path !== redirectPath) {
            r.push({
              path: redirectPath,
              query: { redirect: r.currentRoute.value.fullPath, reason: customCode === 4011 ? 'kicked' : 'deleted' }
            }).catch(() => window.location.href = redirectPath);
          } else {
            window.location.href = redirectPath;
          }
        });
      } else {
        switch (status) {
          case 400:
            message = '请求错误，请检查输入数据';
            break;
          case 401:
            message = '登录已过期，请重新登录';
            // 处理401错误：先获取 role 再清除
            {
              const currentRole = localStorage.getItem('role') || 'user';
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              localStorage.removeItem('userInfo');
              localStorage.removeItem('adminInfo');

              const redirectPath = currentRole === 'admin' ? '/admin/login' : '/login';
              const currentPath = window.location.pathname;

              // 确保不在登录页时才跳转
              if (currentPath !== redirectPath && !currentPath.includes('/login')) {
                // 异步获取router并跳转
                getRouter().then(r => {
                  if (r) {
                    r.push({
                      path: redirectPath,
                      query: { redirect: window.location.pathname + window.location.search, reason: 'expired' }
                    }).catch(() => window.location.href = redirectPath);
                  } else {
                    window.location.href = redirectPath;
                  }
                });
              }
            }
            break;
          case 403:
            message = '拒绝访问，您没有权限执行此操作';
            break;
          case 404:
            message = '请求的资源不存在';
            break;
          case 500:
            message = '服务器错误，请稍后再试';
            break;
          default:
            message = `请求失败(${status})`;
        }
      }

      errorResponse = {
        success: false,
        message: error.response.data?.message || message,
        data: null,
        code: status
      };
    } else if (error.request) {
      // 网络错误
      errorResponse = {
        success: false,
        message: '网络连接失败，请检查网络',
        data: null,
        code: 0
      };
    } else {
      // 其他错误
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