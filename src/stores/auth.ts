import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 设备检测函数
const isMobileDevice = () => {
  // 检查是否强制使用特定版本
  if (window.forcePcVersion) return false;
  if (window.forceMobileVersion) return true;

  // 否则根据设备类型判断
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
         (window.innerWidth <= 768);
};

// 为TypeScript声明全局window属性
declare global {
  interface Window {
    forcePcVersion?: boolean;
    forceMobileVersion?: boolean;
  }
}

export const useAuthStore = defineStore('auth', () => {
  // 通用状态（从localStorage读取，保持同步）
  const token = ref<string | null>(localStorage.getItem('token'));
  const role = ref<string>(localStorage.getItem('role') || 'user');
  const loading = ref<boolean>(false);

  // 通用计算属性
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => role.value === 'admin');
  const isUser = computed(() => role.value === 'user');

  // 获取对应平台的认证store
  const getPlatformAuthStore = async () => {
    if (isMobileDevice()) {
      // 移动端
      const { useMpAuthStore } = await import('@/mp/stores/auth');
      return useMpAuthStore();
    } else {
      // PC端
      const { usePcAuthStore } = await import('@/pc/stores/auth');
      return usePcAuthStore();
    }
  };

  // 通用方法：委托给对应平台的store
  const login = async (credentials: any) => {
    const platformStore = await getPlatformAuthStore();
    const result = await platformStore.login(credentials);

    // 同步状态
    if (result) {
      token.value = localStorage.getItem('token');
      role.value = localStorage.getItem('role') || 'user';
    }

    return result;
  };

  const logout = async () => {
    const platformStore = await getPlatformAuthStore();
    await platformStore.logout();

    // 同步状态
    token.value = null;
    role.value = 'user';
  };

  const getUserInfo = async () => {
    const platformStore = await getPlatformAuthStore();
    return await platformStore.getUserInfo();
  };


  // 初始化认证状态
  const initAuth = async () => {
    if (token.value) {
      await getUserInfo();
    }
  };

  // 监听localStorage变化，保持状态同步
  const syncFromStorage = () => {
    token.value = localStorage.getItem('token');
    role.value = localStorage.getItem('role') || 'user';
  };

  // 检查是否有权限
  const hasPermission = (requiredRole: string) => {
    if (!isAuthenticated.value) return false;
    if (requiredRole === 'admin') return isAdmin.value;
    return true;
  };

  return {
    // 通用状态
    token,
    role,
    loading,

    // 通用计算属性
    isAuthenticated,
    isAdmin,
    isUser,

    // 通用方法
    login,
    logout,
    getUserInfo,
    hasPermission,
    initAuth,
    syncFromStorage,

    // 平台检测
    isMobileDevice,
    getPlatformAuthStore
  };
});

export default useAuthStore;