import { RouteRecordRaw } from 'vue-router';

// 导入工具组件
const ImageCompressor = () => import('@/mp/components/tools/imageCompressor.vue');
const ImageToText = () => import('@/mp/components/tools/imageToText.vue');
const CreateZIP = () => import('@/mp/components/tools/createZIP.vue');
const ExtractZIP = () => import('@/mp/components/tools/extractZIP.vue');
const Empty = () => import('@/mp/components/all/EmptyLayout.vue');
const AllAI = () => import('@/mp/components/tools/allAI.vue');

// 创建工具路由函数，根据角色生成不同的路由配置
const createToolsRoutes = (role: 'user' | 'admin'): RouteRecordRaw => {
  const prefix = role === 'admin' ? 'Admin' : 'User';
  const basePath = `/${role}/tools`;
  
  return {
    path: basePath,
    name: `${prefix}Tools`,
    component: Empty, // 使用空布局组件
    meta: {
      title: '工具',
      icon: 'el-icon-s-tools',
      isTab: true,
      order: 3,
      requiresAuth: true,
      role
    },
    children: [
      {
        path: 'image-compressor',
        name: `${prefix}ImageCompressor`,
        component: ImageCompressor,
        meta: {
          title: '图片压缩工具',
          icon: 'el-icon-picture',
          iconBg: '#43587b',
          requiresAuth: true,
          role
        }
      },
      {
        path: 'text-recognition',
        name: `${prefix}TextRecognition`,
        component: ImageToText,
        meta: {
          title: '图片转文字',
          icon: 'el-icon-document',
          iconBg: '#07c160',
          requiresAuth: true,
          role
        }
      },
      {
        path: 'file-compressor',
        name: `${prefix}FileCompressor`,
        component: CreateZIP,
        meta: {
          title: '制作压缩包',
          icon: 'el-icon-folder',
          iconBg: '#ff9900',
          requiresAuth: true,
          role
        }
      },
      {
        path: 'file-extractor',
        name: `${prefix}FileExtractor`,
        component: ExtractZIP,
        meta: {
          title: '解压压缩包',
          icon: 'el-icon-folder-opened',
          iconBg: '#e6a23c',
          requiresAuth: true,
          role
        }
      },
      {
        path: 'AllAI',
        name: `${prefix}AllAI`,
        component: AllAI,
        meta: {
          title: 'AI工具大全',
          iconBg: '#1593ff',
          requiresAuth: true,
          role
        }
      }
    ]
  };
};

const toolsRoutes: RouteRecordRaw[] = [
  createToolsRoutes('user'),
  createToolsRoutes('admin')
];
export default toolsRoutes; 