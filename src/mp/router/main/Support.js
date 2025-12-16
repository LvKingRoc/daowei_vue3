// 懒加载组件
const Support = () => import('@/mp/components/view/main/Support.vue');

// 支持路由配置
const supportRoutes = [
  {
    path: '/user/support',
    name: 'UserSupport',
    component: Support,
    meta: {
      title: '支持',
      requiresAuth: true,
      role: 'user',
      showBack: false
    }
  },
  {
    path: '/admin/support',
    name: 'AdminSupport',
    component: Support,
    meta: {
      title: '支持',
      requiresAuth: true,
      role: 'admin',
      showBack: false
    }
  }
];

export default supportRoutes;
