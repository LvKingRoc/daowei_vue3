import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import request from '@/core/utils/request';
import { getPlatform, isMobileDevice } from '@/core/utils/device';

// 在应用启动时确定并缓存当前平台（无需单独保存变量）
getPlatform();

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
