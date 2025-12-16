// 懒加载组件以提高性能（普通用户与管理员共用管理页面，统一放在 view/management）
const CustomerManagement = () => import('@/pc/components/view/management/CustomerManagement.vue');
const SampleManagement = () => import('@/pc/components/view/management/SampleManagement.vue');
const OrderManagement = () => import('@/pc/components/view/management/OrderManagement.vue');

// 用户路由配置
const userRoutes = [
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
        component: CustomerManagement,
        meta: {
          title: '客户管理',
          requiresAuth: true,
          role: 'user'
        }
      },
      {
        path: 'sampleGuanli',
        name: 'sampleGuanli',
        component: SampleManagement,
        meta: {
          title: '样品管理',
          requiresAuth: true,
          role: 'user'
        }
      },
      {
        path: 'orderGuanli',
        name: 'orderGuanli',
        component: OrderManagement,
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