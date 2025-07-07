import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import request from '@/core/utils/request';
import { ResponseHandler, ApiResponse } from '@/core/utils/ResponseHandler';
import router from '@/pc/router';

export const usePcAuthStore = defineStore('pcAuth', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('token'));
  const role = ref<string>(localStorage.getItem('role') || 'user');
  const userInfo = ref<any>(null);
  const loading = ref<boolean>(false);

  // 计算属性
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => role.value === 'admin');
  const isUser = computed(() => role.value === 'user');

  // 获取用户信息 - 不再调用API，直接使用本地存储的信息
  const getUserInfo = async () => {
    if (!token.value) return null;
    
    try {
      loading.value = true;
      
      // 从本地存储中获取用户信息
      const username = localStorage.getItem('username') || '用户';
      
      // 直接使用本地存储的基本信息
      userInfo.value = {
        username,
        role: role.value,
        // 可以添加其他默认属性
      };
      
      return userInfo.value;
    } catch (error) {
      console.warn('获取用户信息失败', error);
      userInfo.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  // PC端登录
  const login = async (credentials: { username: string; password: string; isAdmin?: boolean }) => {
    try {
      loading.value = true;
      const loginPath = credentials.isAdmin ? '/admin/login' : '/user/login';
      const response = await request.post(loginPath, credentials) as ApiResponse;
      
      // 使用新的响应处理器
      const result = ResponseHandler.handle(response, {
        showSuccessMessage: false,
        showErrorMessage: true,
        errorMessage: '登录失败，请检查用户名和密码'
      });
      
      if (result.success && result.data) {
        // 保存到本地存储
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('role', credentials.isAdmin ? 'admin' : 'user');
        localStorage.setItem('username', credentials.username);
        
        // 更新状态
        token.value = result.data.token;
        role.value = credentials.isAdmin ? 'admin' : 'user';
        
        // 重定向到首页或指定页面
        const redirectPath = router.currentRoute.value.query.redirect as string || 
          (credentials.isAdmin ? '/admin/home' : '/user/home');
        
        // 设置重定向路径到本地存储，以便刷新后重定向
        localStorage.setItem('redirectAfterLogin', redirectPath);
        
        // 强制刷新页面
        window.location.href = redirectPath;
        return true;
      }
      return false;
    } catch (error: any) {
      // 网络错误或其他异常
      if (error.success === false) {
        // 这是ApiResponse格式的错误
        ResponseHandler.handle(error, {
          showErrorMessage: true,
          errorMessage: '登录失败，请检查用户名和密码'
        });
      } else {
        // 其他类型的错误
        ResponseHandler.showError('网络连接失败，请稍后再试');
      }
      return false;
    } finally {
      loading.value = false;
    }
  };

  // PC端登出
  const logout = async () => {
    try {
      // 清除状态
      token.value = null;
      userInfo.value = null;
      role.value = 'user';
      
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      localStorage.removeItem('redirectAfterLogin');
      
      // 重定向到登录页
      const loginPath = role.value === 'admin' ? '/admin/login' : '/login';
      router.push(loginPath);
      
      // 强制刷新页面以重新加载组件和权限
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      ResponseHandler.showError('登出失败');
    }
  };

  // 检查是否有权限
  const hasPermission = (requiredRole: string) => {
    if (!isAuthenticated.value) return false;
    if (requiredRole === 'admin') return isAdmin.value;
    return true;
  };

  // 初始化认证状态
  const initAuth = async () => {
    if (token.value) {
      await getUserInfo();
    }
  };

  return {
    // 状态
    token,
    role,
    userInfo,
    loading,
    
    // 计算属性
    isAuthenticated,
    isAdmin,
    isUser,
    
    // 方法
    getUserInfo,
    login,
    logout,
    hasPermission,
    initAuth
  };
});

export default usePcAuthStore;
