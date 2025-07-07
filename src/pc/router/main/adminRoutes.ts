import { RouteRecordRaw } from 'vue-router';

// 懒加载组件以提高性能
const CustomerManagement = () => import('@/pc/components/admin/CustomerManagement.vue');
const SampleManagement = () => import('@/pc/components/admin/SampleManagement.vue');
const OrderManagement = () => import('@/pc/components/admin/OrderManagement.vue');
const EmployeeManagement = () => import('@/pc/components/admin/EmployeeManagement.vue');
const UserManagement = () => import('@/pc/components/admin/UserManagement.vue');
const Dashboard = () => import('@/pc/components/admin/Dashboard.vue');

// 管理员路由配置
const adminRoutes: RouteRecordRaw[] = [
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
    meta: {
      title: '管理',
      requiresAuth: true,
      role: 'admin',
      menuGroup: 'management'
    },
    children: [
      {
        path: 'customerManagement',
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
        path: 'sampleManagement',
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
        path: 'orderManagement',
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
        path: 'employeeManagement',
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
        path: 'userManagement',
        name: 'UserManagement',
        component: UserManagement,
        meta: {
          title: '用户管理',
          requiresAuth: true,
          role: 'admin',
          menuGroup: 'management'
        }
      }
    ]
  }
];

export default adminRoutes; 