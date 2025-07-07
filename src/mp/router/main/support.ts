import { RouteRecordRaw } from 'vue-router';
import Support from '@/mp/components/all/support.vue';

const supportRoutes: RouteRecordRaw[] = [
  {
    path: '/user/support',
    name: 'UserSupport',
    component: Support,
    meta: {
      title: '退出',
      icon: 'el-icon-service',
      isTab: true,
      order: 4,
      requiresAuth: true,
      role: 'user'  
    }
  },
  {
    path: '/admin/support',
    name: 'AdminSupport',
    component: Support,
    meta: {
      title: '退出',
      icon: 'el-icon-service',
      isTab: true,
      order: 4,
      requiresAuth: true,
      role: 'admin'
    }
  }
];

export default supportRoutes; 