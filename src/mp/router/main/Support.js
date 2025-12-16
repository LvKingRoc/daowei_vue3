import Support from '@/mp/components/view/main/Support.vue';

// 支持路由配置
const supportRoutes = [
  {
    path: '/user/support',
    name: 'Support',
    component: Support,
    meta: {
      title: '支持一下',
      requiresAuth: true,
      role: 'user'
    }
  },
  {
    path: '/admin/support',
    name: 'AdminSupport',
    component: Support,
    meta: {
      title: '支持一下',
      requiresAuth: true,
      role: 'admin',
      menuGroup: 'profile'
    }
  }
];

export default supportRoutes;
