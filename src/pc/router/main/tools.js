// 懒加载组件以提高性能
const ImageCompressor = () => import('@/pc/components/view/tools/ImageCompressor.vue');
const FileCompressor = () => import('@/pc/components/view/tools/CreateZIP.vue');
const FileExtractor = () => import('@/pc/components/view/tools/ExtractZIP.vue');
const TextRecognition = () => import('@/pc/components/view/tools/ImageToText.vue');
const AllAI = () => import('@/pc/components/view/tools/AllAI.vue');

// 工具箱路由配置 - 共享组件
const createToolsRoutes = (role) => {
  const prefix = role === 'admin' ? 'Admin' : 'User';
  const basePath = `/${role}/tools`;
  
  return {
    path: basePath,
    name: `${prefix}Tools`,
    meta: {
      title: '工具箱',
      requiresAuth: true,
      role,
      menuGroup: 'tools'
    },
    children: [
      {
        path: 'image-compressor',
        name: `${prefix}ImageCompressor`,
        component: ImageCompressor,
        meta: {
          title: '图片压缩工具',
          requiresAuth: true,
          role,
          menuGroup: 'tools'
        }
      },
      {
        path: 'text-recognition',
        name: `${prefix}TextRecognition`,
        component: TextRecognition,
        meta: {
          title: '图片转文字',
          requiresAuth: true,
          role,
          menuGroup: 'tools'
        }
      },
      {
        path: 'file-compressor',
        name: `${prefix}FileCompressor`,
        component: FileCompressor,
        meta: {
          title: '制作压缩包',
          requiresAuth: true,
          role,
          menuGroup: 'tools'
        }
      },
      {
        path: 'file-extractor',
        name: `${prefix}FileExtractor`,
        component: FileExtractor,
        meta: {
          title: '解压压缩包',
          requiresAuth: true,
          role,
          menuGroup: 'tools'
        }
      },
      {
        path: 'AllAI',
        name: `${prefix}AllAI`,
        component: AllAI,
        meta: {
          title: 'AI大全',
          requiresAuth: true,
          role,
          menuGroup: 'tools'
        }
      }
    ]
  };
};

// 创建用户和管理员的工具箱路由
const toolsRoutes = [
  createToolsRoutes('user'),
  createToolsRoutes('admin')
];

export default toolsRoutes;