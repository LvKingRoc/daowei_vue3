<template>
  <div class="mp-app">
    <!-- 登录页面不使用主布局 -->
    <template v-if="isLoginPage">
      <RouterView />
    </template>
    
    <!-- 其他页面使用主布局 -->
    <template v-else>
      <MainLayout />
    </template>
  </div>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router';
import { computed, getCurrentInstance } from 'vue';
import MainLayout from './components/layout/mainLayout.vue';
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
  Tab,
  NavBar,
  Tabbar,
  TabbarItem,
  NoticeBar,
  Grid,
  GridItem,
  Sticky,
  Card,
  SwipeCell,
  Radio,
  RadioGroup,
  Stepper,
  Progress
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
  app.use(NavBar);
  app.use(Tabbar);
  app.use(TabbarItem);
  app.use(NoticeBar);
  app.use(Grid);
  app.use(GridItem);
  app.use(Sticky);
  app.use(Card);
  app.use(SwipeCell);
  app.use(Radio);
  app.use(RadioGroup);
  app.use(Stepper);
  app.use(Progress);
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
  background-color: #f7f8fa;
}

body {
  overflow-y: auto; /* 允许垂直滚动 but control it */
  overscroll-behavior: none; /* 防止页面弹性滚动 */
}

.mp-app {
  width: 100%;
  min-height: 100vh;
  /* 移动端特有样式 */
  touch-action: pan-y; /* 只允许垂直方向的滚动和触摸 */
  -webkit-overflow-scrolling: touch;
}

/* 避免溢出 */
* {
  box-sizing: border-box;
  max-width: 100%;
  word-wrap: break-word;
}

/* Vant 全局样式调整 */
:root {
  --van-nav-bar-background: #ffffff;
  --van-nav-bar-title-text-color: #323233;
  --van-nav-bar-icon-color: #323233;
  --van-nav-bar-text-color: #323233;
}
</style>
