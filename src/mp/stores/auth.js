/**
 * 移动端认证Store - 向后兼容入口
 * 实际使用统一的platformAuth
 */
import { usePlatformAuthStore } from '@/stores/platformAuth';

export const useMpAuthStore = usePlatformAuthStore;

export default useMpAuthStore;
