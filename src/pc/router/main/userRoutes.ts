import { RouteRecordRaw } from 'vue-router';

// 懒加载组件以提高性能
const customerGuanli = () => import('@/pc/components/user/Customer-guanli.vue');
const sampleGuanli = () => import('@/pc/components/user/Sample-guanli.vue');
const orderGuanli = () => import('@/pc/components/user/Order-guanli.vue');

// 用户路由配置
const userRoutes: RouteRecordRaw[] = [
  {
    path: '/user/management',
    name: 'management',
    meta: {
      title: '管理',
      requiresAuth: true,
      role: 'user'
    },
    children: [
      {
        path: 'customerGuanli',
        name: 'customerGuanli',
        component: customerGuanli,
        meta: {
          title: '客户管理',
          requiresAuth: true,
          role: 'user'
        }
      },
      {
        path: 'sampleGuanli',
        name: 'sampleGuanli',
        component: sampleGuanli,
        meta: {
          title: '样品管理',
          requiresAuth: true,
          role: 'user'
        }
      },
      {
        path: 'orderGuanli',
        name: 'orderGuanli',
        component: orderGuanli,
        meta: {
          title: '订单管理',
          requiresAuth: true,
          role: 'user'
        }
      }
    ]
  }
];

export default userRoutes; 