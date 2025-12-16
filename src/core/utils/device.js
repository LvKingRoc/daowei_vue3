// 统一的设备/平台检测工具（纯 JavaScript）

// 检测当前平台：返回 'pc' 或 'mp'
export const detectPlatform = () => {
  if (typeof window === 'undefined') {
    // 默认按 PC 处理
    return 'pc';
  }

  if (window.forcePcVersion) return 'pc';
  if (window.forceMobileVersion) return 'mp';

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
    (window.innerWidth <= 768);

  return isMobile ? 'mp' : 'pc';
};

// 获取当前平台（优先使用已决定的平台）
export const getPlatform = () => {
  if (typeof window === 'undefined') return 'pc';

  const cached = window.__APP_PLATFORM__;
  if (cached === 'pc' || cached === 'mp') return cached;

  const platform = detectPlatform();
  window.__APP_PLATFORM__ = platform;
  return platform;
};

// 是否为移动端
export const isMobileDevice = () => getPlatform() === 'mp';

export default {
  detectPlatform,
  getPlatform,
  isMobileDevice
};
