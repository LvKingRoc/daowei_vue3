// 懒加载组件
const ManagementIndex = () => import('@/mp/components/view/management/ManagementIndex.vue');
const CustomerManagement = () => import('@/mp/components/view/management/CustomerManagement.vue');
const SampleManagement = () => import('@/mp/components/view/management/SampleManagement.vue');
const OrderManagement = () => import('@/mp/components/view/management/OrderManagement.vue');
const EmployeeManagement = () => import('@/mp/components/view/management/EmployeeManagement.vue');
const UserManagement = () => import('@/mp/components/view/management/UserManagement.vue');

// 管理员路由配置（扁平结构）
const adminRoutes = [
  {
    path: '/admin/management',
    name: 'Management',
    component: ManagementIndex,
    meta: {
      title: '管理',
      requiresAuth: true,
      role: 'admin',
      menuGroup: 'management'
    }
  },
  {
    path: '/admin/management/customerManagement',
    name: 'CustomerManagement',
    component: CustomerManagement,
    meta: {
      title: '客户管理',
      requiresAuth: true,
      role: 'admin',
      menuGroup: 'management',
      showBack: true,
      showRefresh: true
    }
  },
  {
    path: '/admin/management/sampleManagement',
    name: 'SampleManagement',
    component: SampleManagement,
    meta: {
      title: '样品管理',
      requiresAuth: true,
      role: 'admin',
      menuGroup: 'management',
      showBack: true,
      showRefresh: true
    }
  },
  {
    path: '/admin/management/orderManagement',
    name: 'OrderManagement',
    component: OrderManagement,
    meta: {
      title: '订单管理',
      requiresAuth: true,
      role: 'admin',
      menuGroup: 'management',
      showBack: true,
      showRefresh: true
    }
  },
  {
    path: '/admin/management/employeeManagement',
    name: 'EmployeeManagement',
    component: EmployeeManagement,
    meta: {
      title: '员工管理',
      requiresAuth: true,
      role: 'admin',
      menuGroup: 'management',
      showBack: true,
      showRefresh: true
    }
  },
  {
    path: '/admin/management/userManagement',
    name: 'UserManagement',
    component: UserManagement,
    meta: {
      title: '用户管理',
      requiresAuth: true,
      role: 'admin',
      menuGroup: 'management',
      showBack: true,
      showRefresh: true
    }
  }
];

export default adminRoutes;
