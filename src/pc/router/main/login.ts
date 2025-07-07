import { RouteRecordRaw } from 'vue-router';
import { getAuthData, defaultRedirects } from '../utils.ts';

const UserLogin = () => import('@/pc/components/login/UserLogin.vue');
const AdminLogin = () => import('@/pc/components/login/AdminLogin.vue');
// 公共路由配置
const commonRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: () => {
      const { token, role } = getAuthData();
      return token 
        ? defaultRedirects[role as keyof typeof defaultRedirects] 
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
      hiddenCommonComponents: true, 
      layout: 'empty', 
      hiddenInMenu: true 
    }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin,
    meta: { 
      title: '管理员登录', 
      role: 'admin', 
      hiddenCommonComponents: true, 
      layout: 'empty', 
      hiddenInMenu: true 
    }
  }
];

export default commonRoutes; 