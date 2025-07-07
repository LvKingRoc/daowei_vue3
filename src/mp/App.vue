<template>
  <div class="mp-app">
    <!-- 登录页面不使用主布局 -->
    <template v-if="isLoginPage">
      <RouterView />
    </template>
    
    <!-- 其他页面使用主布局 -->
    <template v-else>
      <main-layout />
    </template>
  </div>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router';
import { computed, onMounted, getCurrentInstance } from 'vue';
import MainLayout from './components/all/mainLayout.vue';
import {
  Button,
  Cell,
  CellGroup,
  Field,
  Form,
  Icon,
  Image as VanImage,
  List,
  Picker,
  Popup,
  PullRefresh,
  Toast,
  Dialog,
  Uploader,
  Search,
  Empty,
  Loading,
  Tag,
  DatePicker,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab
} from 'vant';
import 'vant/lib/index.css';

const route = useRoute();

// 检查是否为登录页面
const isLoginPage = computed(() => {
  return route.path === '/login' || 
         route.path === '/admin/login' ||
         route.path.includes('login');
});

// 全局注册Vant组件
const app = getCurrentInstance()?.appContext.app;
if (app) {
  app.use(Button);
  app.use(Cell);
  app.use(CellGroup);
  app.use(Field);
  app.use(Form);
  app.use(Icon);
  app.use(VanImage);
  app.use(List);
  app.use(Picker);
  app.use(Popup);
  app.use(PullRefresh);
  app.use(Toast);
  app.use(Dialog);
  app.use(Uploader);
  app.use(Search);
  app.use(Empty);
  app.use(Loading);
  app.use(Tag);
  app.use(DatePicker);
  app.use(DropdownMenu);
  app.use(DropdownItem);
  app.use(Tabs);
  app.use(Tab);
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
  overflow-x: hidden; /* 防止水平滚动 */
  position: relative; /* 确保定位正确 */
}

body {
  overflow-y: auto; /* 允许垂直滚动但控制它 */
  overscroll-behavior: none; /* 防止页面弹性滚动 */
}

.mp-app {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  /* 移动端特有样式 */
  touch-action: pan-y; /* 只允许垂直方向的滚动和触摸 */
  -webkit-overflow-scrolling: touch;
  overflow-x: hidden; /* 确保内容不会水平溢出 */
  position: relative; /* 确保内部定位正确 */
}

/* 移动端全局样式调整 */
.el-button {
  padding: 10px 20px;
}

.el-input__inner {
  height: 40px;
}

/* 提高移动端点击区域大小 */
.el-checkbox__label,
.el-radio__label {
  padding-left: 8px;
}

/* 避免溢出 */
* {
  box-sizing: border-box;
  max-width: 100%;
  word-wrap: break-word; /* 确保文本不会溢出容器 */
}

/* 修复一些移动端字体问题 */
input, textarea, select, button {
  font-size: 16px; /* 避免在iOS上放大 */
}

/* 图片和其他媒体的溢出控制 */
img, video, canvas, svg {
  max-width: 100%;
  height: auto;
}
</style> 