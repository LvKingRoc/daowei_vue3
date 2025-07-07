import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import request from '@/core/utils/request';
import { ResponseHandler, ApiResponse } from '@/core/utils/ResponseHandler';
import router from '@/mp/router';

// 类型定义
interface UserInfo {
  username: string;
  role: string;
  lastLoginTime?: string;
  avatar?: string;
  permissions?: string[];
}

interface LoginCredentials {
  username: string;
  password: string;
  isAdmin?: boolean;
  remember?: boolean;
}

interface AuthState {
  token: string | null;
  role: string;
  userInfo: UserInfo | null;
  loading: boolean;
  initialized: boolean;
}

export const useMpAuthStore = defineStore('mpAuth', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('token'));
  const role = ref<string>(localStorage.getItem('role') || 'user');
  const userInfo = ref<UserInfo | null>(null);
  const loading = ref<boolean>(false);
  const initialized = ref<boolean>(false);

  // 计算属性
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => role.value === 'admin');
  const isUser = computed(() => role.value === 'user');
  const permissions = computed(() => userInfo.value?.permissions || []);

  // 初始化状态
  const initializeAuth = async () => {
    if (initialized.value) return;
    
    if (token.value) {
      await getUserInfo();
    }
    
    initialized.value = true;
  };

  // 获取用户信息
  const getUserInfo = async () => {
    if (!token.value) return null;
    
    try {
      loading.value = true;
      
      // 从本地存储中获取基本信息
      const username = localStorage.getItem('username') || '用户';
      const lastLoginTime = localStorage.getItem('lastLoginTime');
      const avatar = localStorage.getItem('avatar');
      
      // 构建用户信息对象
      const info: UserInfo = {
        username,
        role: role.value,
        lastLoginTime: lastLoginTime || new Date().toISOString(),
        avatar: avatar || '/default-avatar.png',
        permissions: role.value === 'admin' ? ['admin'] : ['user']
      };
      
      userInfo.value = info;
      return info;
    } catch (error) {
      userInfo.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  // 登录
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      loading.value = true;
      const loginPath = credentials.isAdmin ? '/admin/login' : '/user/login';

      const response = await request.post(loginPath, {
        username: credentials.username,
        password: credentials.password
      }) as ApiResponse;

      // 使用新的响应处理器
      const result = ResponseHandler.handle(response, {
        showSuccessMessage: false,
        showErrorMessage: true,
        errorMessage: '登录失败，请检查用户名和密码'
      });

      if (result.success && result.data) {
        // 保存认证信息
        token.value = result.data.token;
        role.value = credentials.isAdmin ? 'admin' : 'user';

        // 更新本地存储
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('role', role.value);
        localStorage.setItem('username', credentials.username);
        localStorage.setItem('lastLoginTime', new Date().toISOString());

        if (credentials.remember) {
          localStorage.setItem('rememberUser', credentials.username);
        } else {
          localStorage.removeItem('rememberUser');
        }

        // 设置用户信息
        await getUserInfo();

        // 处理重定向
        const redirectPath = router.currentRoute.value.query.redirect as string ||
          (role.value === 'admin' ? '/admin/home' : '/user/home');

        await router.push(redirectPath);
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

  // 登出
  const logout = async (redirect: boolean = true) => {
    try {
      // 保存当前角色用于重定向
      const currentRole = role.value;
      
      // 清除状态
      token.value = null;
      userInfo.value = null;
      role.value = 'user';
      
      // 清除本地存储（保留记住的用户名）
      const rememberedUser = localStorage.getItem('rememberUser');
      localStorage.clear();
      if (rememberedUser) {
        localStorage.setItem('rememberUser', rememberedUser);
      }
      
      // 重定向到登录页
      if (redirect) {
        const loginPath = currentRole === 'admin' ? '/admin/login' : '/login';
        await router.push(loginPath);
      }
    } catch (error) {
      ResponseHandler.showError('登出失败');
    }
  };

  // 检查权限
  const hasPermission = (requiredPermission: string | string[]): boolean => {
    if (!isAuthenticated.value) return false;
    
    const userPermissions = permissions.value;
    
    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some(perm => userPermissions.includes(perm));
    }
    
    return userPermissions.includes(requiredPermission);
  };

  // 更新用户信息
  const updateUserInfo = async (updates: Partial<UserInfo>) => {
    try {
      loading.value = true;
      
      // 这里可以添加更新用户信息的API调用
      
      // 更新本地状态
      if (userInfo.value) {
        userInfo.value = { ...userInfo.value, ...updates };
        
        // 更新本地存储
        if (updates.username) {
          localStorage.setItem('username', updates.username);
        }
        if (updates.avatar) {
          localStorage.setItem('avatar', updates.avatar);
        }
      }
    } catch (error) {
      ResponseHandler.showError('更新用户信息失败');
    } finally {
      loading.value = false;
    }
  };

  // 检查token是否过期
  const checkTokenExpiration = () => {
    const tokenExpirationTime = localStorage.getItem('tokenExpirationTime');
    if (tokenExpirationTime && new Date(tokenExpirationTime) < new Date()) {
      logout(true);
      ResponseHandler.showError('登录已过期，请重新登录');
    }
  };

  return {
    // 状态
    token,
    role,
    userInfo,
    loading,
    initialized,
    
    // 计算属性
    isAuthenticated,
    isAdmin,
    isUser,
    permissions,
    
    // 方法
    initializeAuth,
    login,
    logout,
    getUserInfo,
    hasPermission,
    updateUserInfo,
    checkTokenExpiration
  };
});

export default useMpAuthStore;