/**
 * 统一平台认证Store
 * 合并PC端和移动端的auth store，通过动态导入router实现平台适配
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/core/api/auth';
import ResponseHandler from '@/core/utils/ResponseHandler';
import { getPlatform } from '@/core/utils/device';

// 动态获取当前平台的router
const getRouter = async () => {
  const platform = getPlatform();
  if (platform === 'mp') {
    const module = await import('@/mp/router');
    return module.default;
  }
  const module = await import('@/pc/router');
  return module.default;
};

export const usePlatformAuthStore = defineStore('platformAuth', () => {
  // 状态 - 使用 localStorage 保存 token（持久化）
  const token = ref(localStorage.getItem('token'));
  const role = ref(localStorage.getItem('role') || 'user');
  const userInfo = ref(null);
  const loading = ref(false);

  // 计算属性
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => role.value === 'admin');
  const isUser = computed(() => role.value === 'user');

  // 获取用户信息 - 直接使用本地存储的信息
  const getUserInfo = async () => {
    if (!token.value) return null;
    
    try {
      loading.value = true;
      const username = localStorage.getItem('username') || '用户';
      
      userInfo.value = {
        username,
        role: role.value,
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

  // 登录
  const login = async (credentials) => {
    try {
      loading.value = true;

      const payload = {
        username: credentials.username,
        password: credentials.password
      };

      const response = credentials.isAdmin
        ? await authApi.adminLogin(payload)
        : await authApi.userLogin(payload);

      const result = ResponseHandler.handle(response, {
        showSuccessMessage: false,
        showErrorMessage: true,
        errorMessage: '登录失败，请检查用户名和密码'
      });

      if (result.success && result.data) {
        const userRole = credentials.isAdmin ? 'admin' : 'user';
        
        // 保存到 localStorage
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('role', userRole);
        localStorage.setItem('username', credentials.username);

        // 更新状态
        token.value = result.data.token;
        role.value = userRole;

        // 获取router并重定向
        const router = await getRouter();
        const redirectQuery = router.currentRoute.value.query.redirect;
        const redirectPath = typeof redirectQuery === 'string'
          ? redirectQuery
          : (credentials.isAdmin ? '/admin/home' : '/user/home');

        localStorage.setItem('redirectAfterLogin', redirectPath);
        window.location.href = redirectPath;
        return true;
      }

      return false;
    } catch (error) {
      ResponseHandler.handle(error, {
        showErrorMessage: true,
        errorMessage: '登录失败，请检查用户名和密码'
      });
      return false;
    } finally {
      loading.value = false;
    }
  };

  // 登出
  const logout = async () => {
    try {
      // 清除状态
      token.value = null;
      userInfo.value = null;
      const previousRole = role.value;
      role.value = 'user';
      
      // 清除 localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      localStorage.removeItem('redirectAfterLogin');
      
      // 获取router并重定向
      const router = await getRouter();
      const loginPath = previousRole === 'admin' ? '/admin/login' : '/login';
      router.push(loginPath);
      
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      ResponseHandler.showError('登出失败');
    }
  };

  // 检查权限
  const hasPermission = (requiredRole) => {
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

  // 校验 token 是否有效
  const verifyToken = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      return { valid: false };
    }

    try {
      const response = await authApi.verifyToken();
      const result = ResponseHandler.handle(response, {
        showSuccessMessage: false,
        showErrorMessage: false
      });

      if (result.success && result.data) {
        token.value = savedToken;
        role.value = result.data.role;
        localStorage.setItem('role', result.data.role);
        
        if (result.data.newToken) {
          token.value = result.data.newToken;
          localStorage.setItem('token', result.data.newToken);
        }
        
        return { valid: true, role: result.data.role };
      } else {
        clearAuth();
        return { valid: false };
      }
    } catch (error) {
      console.error('Token校验失败:', error);
      clearAuth();
      return { valid: false };
    }
  };

  // 清除认证信息
  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    token.value = null;
    role.value = 'user';
  };

  // 从storage同步状态
  const syncFromStorage = () => {
    token.value = localStorage.getItem('token');
    role.value = localStorage.getItem('role') || 'user';
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
    initAuth,
    verifyToken,
    syncFromStorage,
    clearAuth
  };
});

export default usePlatformAuthStore;
