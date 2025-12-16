import { getAuthData, defaultRedirects } from '../utils';

const UserLogin = () => import('@/mp/components/login/UserLogin.vue');
const AdminLogin = () => import('@/mp/components/login/AdminLogin.vue');

// 公共路由配置
const commonRoutes = [
  {
    path: '/',
    redirect: () => {
      const { token, role } = getAuthData();
      return token 
        ? defaultRedirects[role] 
        : role === 'admin' 
          ? defaultRedirects.adminUnauthenticated 
          : defaultRedirects.unauthenticated;
    },
    meta: { hiddenInMenu: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: UserLogin,
    meta: { 
      title: '用户登录', 
      role: 'user', 
      hideHeader: true,
      hideMenu: true
    }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin,
    meta: { 
      title: '管理员登录', 
      role: 'admin', 
      hideHeader: true,
      hideMenu: true
    }
  }
];

export default commonRoutes;
