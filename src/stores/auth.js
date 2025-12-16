/**
 * 认证Store - 统一入口
 * 直接使用platformAuth，保持向后兼容
 */
import { usePlatformAuthStore } from './platformAuth';
import { isMobileDevice } from '@/core/utils/device';

// 导出统一的auth store
export const useAuthStore = usePlatformAuthStore;

// 向后兼容：导出平台特定的store名称
export const usePcAuthStore = usePlatformAuthStore;
export const useMpAuthStore = usePlatformAuthStore;

// 导出设备检测工具
export { isMobileDevice };

export default useAuthStore;