import { RouteRecordRaw } from 'vue-router';
import Empty from '@/mp/components/all/emptyLayout.vue';
import CustomerManagement from '@/mp/components/admin/customerManagement.vue';
import SampleManagement from '@/mp/components/admin/sampleManagement.vue';
import OrderManagement from '@/mp/components/admin/orderManagement.vue';
import EmployeeManagement from '@/mp/components/admin/employeeManagement.vue';
import UserManagement from '@/mp/components/admin/userManagement.vue';

const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/management',
    name: 'AdminManagement',
    component: Empty,
    meta: {
      title: '管理',
      icon: 'el-icon-s-management',
      isTab: true,
      order: 2,
      requiresAuth: true,
      role: 'admin',
      menuGroup: 'management'
    },
    children: [
      {
        path: 'customerManagement',
        name: 'AdminCustomerManagement',
        component: CustomerManagement,
        meta: {
          title: '客户管理',
          icon: 'el-icon-user',
          iconBg: '#1989fa',
          requiresAuth: true,
          role: 'admin',
          menuGroup: 'management',
          hideHeader: true
        }
      },
      {
        path: 'sampleManagement',
        name: 'AdminSampleManagement',
        component: SampleManagement,
        meta: {
          title: '样品管理',
          icon: 'el-icon-s-grid',
          iconBg: '#07c160',
          requiresAuth: true,
          role: 'admin',
          menuGroup: 'management',
          hideHeader: true
        }
      },
      {
        path: 'orderManagement',
        name: 'AdminOrderManagement',
        component: OrderManagement,
        meta: {
          title: '订单管理',
          icon: 'el-icon-s-order',
          iconBg: '#ff9900',
          requiresAuth: true,
          role: 'admin',
          menuGroup: 'management',
          hideHeader: true
        }
      },
      {
        path: 'employeeManagement',
        name: 'AdminEmployeeManagement',
        component: EmployeeManagement,
        meta: {
          title: '员工管理',
          icon: 'el-icon-s-custom',
          iconBg: '#e6a23c',
          requiresAuth: true,
          role: 'admin',
          menuGroup: 'management',
          hideHeader: true
        }
      },
      {
        path: 'userManagement',
        name: 'AdminUserManagement',
        component: UserManagement,
        meta: {
          title: '用户管理',
          icon: 'el-icon-s-check',
          iconBg: '#f56c6c',
          requiresAuth: true,
          role: 'admin',
          menuGroup: 'management',
          hideHeader: true
        }
      }
    ]
  }
];

export default adminRoutes; 