// 懒加载组件
const CustomerManagement = () => import('@/mp/components/view/management/CustomerManagement.vue');
const SampleManagement = () => import('@/mp/components/view/management/SampleManagement.vue');
const OrderManagement = () => import('@/mp/components/view/management/OrderManagement.vue');
const ManagementMenu = () => import('@/mp/components/view/management/ManagementIndex.vue');

// 用户路由配置
const userRoutes = [
  {
    path: '/user/management',
    name: 'UserManagement',
    component: ManagementMenu,
    meta: {
      title: '管理',
      requiresAuth: true,
      role: 'user',
      showBack: false
    }
  },
  {
    path: '/user/management/customer',
    name: 'UserCustomerManagement',
    component: CustomerManagement,
    meta: {
      title: '客户管理',
      requiresAuth: true,
      role: 'user'
    }
  },
  {
    path: '/user/management/sample',
    name: 'UserSampleManagement',
    component: SampleManagement,
    meta: {
      title: '样品管理',
      requiresAuth: true,
      role: 'user'
    }
  },
  {
    path: '/user/management/order',
    name: 'UserOrderManagement',
    component: OrderManagement,
    meta: {
      title: '订单管理',
      requiresAuth: true,
      role: 'user'
    }
  }
];

export default userRoutes;
