import { RouteRecordRaw } from 'vue-router';
import Home from '@/mp/components/all/home.vue';

const homeRoutes: RouteRecordRaw[] = [
  {
    path: '/user/home',
    name: 'UserHome',
    component: Home,
    meta: {
      title: '主页',
      icon: 'el-icon-s-home',
      isTab: true,
      order: 1,
      requiresAuth: true,
      role: 'user'
    }
  },
  {
    path: '/admin/home',
    name: 'AdminHome',
    component: Home,
    meta: {
      title: '主页',
      icon: 'el-icon-s-home',
      isTab: true,
      order: 1,
      requiresAuth: true,
      role: 'admin'
    }
  }
];

export default homeRoutes; 