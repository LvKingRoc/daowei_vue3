import { RouteRecordRaw } from 'vue-router';
import Home from '@/pc/components/all/Home.vue';
// 首页路由配置
const homeRoutes: RouteRecordRaw[] = [
  {
    path: '/user/home',
    name: 'UserHome',
    component: Home,
    meta: {
      title: '用户首页',
      requiresAuth: true,
      role: 'user'
    }
  },
  {
    path: '/admin/home',
    name: 'AdminHome',
    component: Home,
    meta: {
      title: '管理员首页',
      requiresAuth: true,
      role: 'admin',
      menuGroup: 'dashboard'
    }
  }
];

export default homeRoutes; 