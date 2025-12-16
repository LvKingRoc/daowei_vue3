// 懒加载组件
const CustomerManagement = () => import('@/mp/components/view/management/CustomerManagement.vue');
const SampleManagement = () => import('@/mp/components/view/management/SampleManagement.vue');
const OrderManagement = () => import('@/mp/components/view/management/OrderManagement.vue');
const EmployeeManagement = () => import('@/mp/components/view/management/EmployeeManagement.vue');
const UserManagement = () => import('@/mp/components/view/management/UserManagement.vue');
const ManagementMenu = () => import('@/mp/components/view/management/ManagementIndex.vue');

// 管理员路由配置
const adminRoutes = [
  {
    path: '/admin/management',
    name: 'AdminManagement',
    component: ManagementMenu,
    meta: {
      title: '管理',
      requiresAuth: true,
      role: 'admin',
      showBack: false
    }
  },
  {
    path: '/admin/management/customer',
    name: 'AdminCustomerManagement',
    component: CustomerManagement,
    meta: {
      title: '客户管理',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/management/sample',
    name: 'AdminSampleManagement',
    component: SampleManagement,
    meta: {
      title: '样品管理',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/management/order',
    name: 'AdminOrderManagement',
    component: OrderManagement,
    meta: {
      title: '订单管理',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/management/employee',
    name: 'AdminEmployeeManagement',
    component: EmployeeManagement,
    meta: {
      title: '员工管理',
      requiresAuth: true,
      role: 'admin'
    }
  },
  {
    path: '/admin/management/user',
    name: 'AdminUserManagement',
    component: UserManagement,
    meta: {
      title: '用户管理',
      requiresAuth: true,
      role: 'admin'
    }
  },
];

export default adminRoutes;
