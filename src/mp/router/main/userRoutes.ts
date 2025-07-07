import { RouteRecordRaw } from 'vue-router';
import Empty from '@/mp/components/all/emptyLayout.vue';
import CustomerGuanli from '@/mp/components/user/customer-guanli.vue';
import SampleGuanli from '@/mp/components/user/sample-guanli.vue';
import OrderGuanli from '@/mp/components/user/order-guanli.vue';

// 用户路由配置
const userRoutes: RouteRecordRaw[] = [
  {
    path: '/user/management',
    name: 'UserManagement',
    component: Empty,
    meta: {
      title: '管理',
      icon: 'el-icon-s-management',
      isTab: true, // 标记为底部标签页
      order: 2, // 标签页排序
      requiresAuth: true,
      role: 'user' // 用户角色
    },
    children: [
      {
        path: 'customerGuanli',
        name: 'UserCustomerGuanli',
        component: CustomerGuanli,
        meta: {
          title: '客户管理',
          icon: 'el-icon-user',
          iconBg: '#1989fa',
          requiresAuth: true,
          role: 'user',
          hideHeader: true
        }
      },
      {
        path: 'sampleGuanli',
        name: 'UserSampleGuanli',
        component: SampleGuanli,
        meta: {
          title: '样品管理',
          icon: 'el-icon-s-grid',
          iconBg: '#07c160',
          requiresAuth: true,
          role: 'user',
          hideHeader: true
        }
      },
      {
        path: 'orderGuanli',
        name: 'UserOrderGuanli',
        component: OrderGuanli,
        meta: {
          title: '订单管理',
          icon: 'el-icon-s-order',
          iconBg: '#ff9900',
          requiresAuth: true,
          role: 'user',
          hideHeader: true
        }
      }
    ]
  }
];

export default userRoutes; 