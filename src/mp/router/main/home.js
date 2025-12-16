// 懒加载组件
const Home = () => import('@/mp/components/view/main/Home.vue');

// 首页路由配置
const homeRoutes = [
  {
    path: '/user/home',
    name: 'UserHome',
    component: Home,
    meta: {
      title: '首页',
      requiresAuth: true,
      role: 'user',
      showBack: false
    }
  },
  {
    path: '/admin/home',
    name: 'AdminHome',
    component: Home,
    meta: {
      title: '首页',
      requiresAuth: true,
      role: 'admin',
      showBack: false
    }
  }
];

export default homeRoutes;
