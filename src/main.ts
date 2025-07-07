// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import request from '@/core/utils/request';
// 移除旧的错误处理器导入

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

// 根据设备类型异步加载不同的App组件和路由
async function bootstrapApp() {
  let App, router;
  
  if (isMobileDevice()) {
    // 移动端
    console.log('使用移动端版本');
    App = (await import('./mp/App.vue')).default;
    router = (await import('./mp/router')).default;
  } else {
    // PC端
    console.log('使用PC端版本');
    App = (await import('./pc/App.vue')).default;
    router = (await import('./pc/router')).default;
  }
  
  // 创建并挂载应用
  const app = createApp(App);
  const pinia = createPinia();

  // 移除旧的全局错误处理设置

  // 使用 Pinia
  app.use(pinia);

  // 全局挂载请求工具
  app.config.globalProperties.$http = request;
  app.use(ElementPlus);
  app.use(router);
  app.mount('#app');
}

// 启动应用
bootstrapApp();
