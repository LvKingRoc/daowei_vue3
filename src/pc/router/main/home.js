// 懒加载组件以提高性能
const Home = () => import('@/pc/components/view/main/Home.vue');

// 首页路由配置
const homeRoutes = [
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