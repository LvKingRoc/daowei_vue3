// 懒加载组件
const ManagementIndex = () => import('@/mp/components/view/management/ManagementIndex.vue');
const CustomerManagement = () => import('@/mp/components/view/management/CustomerManagement.vue');
const SampleManagement = () => import('@/mp/components/view/management/SampleManagement.vue');
const OrderManagement = () => import('@/mp/components/view/management/OrderManagement.vue');

// 用户路由配置（扁平结构）
const userRoutes = [
  {
    path: '/user/management',
    name: 'UserManagementIndex',
    component: ManagementIndex,
    meta: {
      title: '管理',
      requiresAuth: true,
      role: 'user'
    }
  },
  {
    path: '/user/management/customerGuanli',
    name: 'UserCustomerManagement',
    component: CustomerManagement,
    meta: {
      title: '客户管理',
      requiresAuth: true,
      role: 'user',
      showBack: true
    }
  },
  {
    path: '/user/management/sampleGuanli',
    name: 'UserSampleManagement',
    component: SampleManagement,
    meta: {
      title: '样品管理',
      requiresAuth: true,
      role: 'user',
      showBack: true
    }
  },
  {
    path: '/user/management/orderGuanli',
    name: 'UserOrderManagement',
    component: OrderManagement,
    meta: {
      title: '订单管理',
      requiresAuth: true,
      role: 'user',
      showBack: true
    }
  }
];

export default userRoutes;
