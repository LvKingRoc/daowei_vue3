import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { SERVER_CONFIG, REQUEST_CONFIG } from '@/config/env';
import { ResponseHandler, ApiResponse } from './ResponseHandler';
import router from '@/pc/router';

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: `http://${SERVER_CONFIG.BACKEND_HOST}:${SERVER_CONFIG.BACKEND_PORT}${SERVER_CONFIG.API_BASE_PATH}`,
  timeout: REQUEST_CONFIG.TIMEOUT
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
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
  (error: any): Promise<never> => {
    // 处理请求错误
    ResponseHandler.showError('网络请求失败，请检查网络连接');
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse): ApiResponse => {
    // 统一返回ApiResponse格式
    if (response.data && typeof response.data === 'object') {
      // 登录相关接口特殊处理，不拦截错误，直接返回数据让组件处理
      const url = response.config.url || '';
      if (url.includes('/login')) {
        return response.data;
      }

      // 检查响应格式是否符合ApiResponse
      const apiResponse = response.data as ApiResponse;
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
  (error: any): Promise<ApiResponse> => {
    // 登录接口错误特殊处理
    if (error.config && error.config.url && 
        (error.config.url.includes('/login')) && 
        error.response && error.response.data) {
      // 对于登录接口，直接返回错误信息，不通过错误处理工具显示
      return Promise.reject(error);
    }
    
    // 构造错误响应
    let errorResponse: ApiResponse;

    if (error.response) {
      // 服务器响应错误
      const status = error.response.status;
      let message = '请求失败';

      switch (status) {
        case 400:
          message = '请求错误，请检查输入数据';
          break;
        case 401:
          message = '未授权，请重新登录';
          // 处理401错误
          localStorage.removeItem('token');
          localStorage.removeItem('role');

          const role = localStorage.getItem('role') || 'user';
          const redirectPath = role === 'admin' ? '/admin/login' : '/login';

          if (router.currentRoute.value.path !== redirectPath) {
            router.push({
              path: redirectPath,
              query: { redirect: router.currentRoute.value.fullPath }
            });
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

// 请求接口定义
interface RequestMethods {
  get<T = any>(url: string, params?: any): Promise<T>;
  post<T = any>(url: string, data?: any): Promise<T>;
  put<T = any>(url: string, data?: any): Promise<T>;
  delete<T = any>(url: string, params?: any): Promise<T>;
}

// 导出请求方法
const request: RequestMethods = {
  get<T = any>(url: string, params?: any): Promise<T> {
    return service.get(url, { params });
  },
  post<T = any>(url: string, data?: any): Promise<T> {
    return service.post(url, data);
  },
  put<T = any>(url: string, data?: any): Promise<T> {
    return service.put(url, data);
  },
  delete<T = any>(url: string, params?: any): Promise<T> {
    return service.delete(url, { params });
  }
};

export default request; 