import { RouteRecordRaw } from 'vue-router';
import Support from '@/pc/components/all/Support.vue';

// 支持路由配置
const moneyRoutes: RouteRecordRaw[] = [
  {
    path: '/user/money',
    name: 'UserMoney',
    component: Support,
    meta: {
      title: '支持一下',
      requiresAuth: true,
      role: 'user'
    }
  },
  {
    path: '/admin/money',
    name: 'AdminMoney',
    component: Support,
    meta: {
      title: '支持一下',
      requiresAuth: true,
      role: 'admin',
      menuGroup: 'profile'
    }
  }
];

export default moneyRoutes; 