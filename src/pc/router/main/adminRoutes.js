// 懒加载组件
const CustomerManagement = () => import('@/pc/components/view/management/CustomerManagement.vue');
const SampleManagement = () => import('@/pc/components/view/management/SampleManagement.vue');
const OrderManagement = () => import('@/pc/components/view/management/OrderManagement.vue');
const EmployeeManagement = () => import('@/pc/components/view/management/EmployeeManagement.vue');
const UserManagement = () => import('@/pc/components/view/management/UserManagement.vue');
const Dashboard = () => import('@/pc/components/view/main/Dashboard.vue');
const LogManagement = () => import('@/pc/components/view/management/LogManagement.vue');
const RouterViewWrapper = () => import('@/pc/components/layout/RouterViewWrapper.vue');

// 管理员路由配置
const adminRoutes = [
  {
    path: '/admin/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: '数据大屏',
      requiresAuth: true,
      role: 'admin',
      menuGroup: 'dashboard'
    }
  },
  {
    path: '/admin/management',
    name: 'Management',
    component: RouterViewWrapper,
    redirect: '/admin/management/customer',
    meta: {
      title: '管理',
      requiresAuth: true,
      role: 'admin',
      menuGroup: 'management'
    },
    children: [
      {
        path: 'customer',
        name: 'CustomerManagement',
        component: CustomerManagement,
        meta: {
          title: '客户管理',
          requiresAuth: true,
          role: 'admin',
          menuGroup: 'management'
        }
      },
      {
        path: 'sample',
        name: 'SampleManagement',
        component: SampleManagement,
        meta: {
          title: '样品管理',
          requiresAuth: true,
          role: 'admin',
          menuGroup: 'management'
        }
      },
      {
        path: 'order',
        name: 'OrderManagement',
        component: OrderManagement,
        meta: {
          title: '订单管理',
          requiresAuth: true,
          role: 'admin',
          menuGroup: 'management'
        }
      },
      {
        path: 'employee',
        name: 'EmployeeManagement',
        component: EmployeeManagement,
        meta: {
          title: '员工管理',
          requiresAuth: true,
          role: 'admin',
          menuGroup: 'management'
        }
      },
      {
        path: 'user',
        name: 'UserManagement',
        component: UserManagement,
        meta: {
          title: '用户管理',
          requiresAuth: true,
          role: 'admin',
          menuGroup: 'management'
        }
      },
      {
        path: 'log',
        name: 'LogManagement',
        component: LogManagement,
        meta: {
          title: '操作日志',
          requiresAuth: true,
          role: 'admin',
          menuGroup: 'management'
        }
      }
    ]
  }
];

export default adminRoutes;