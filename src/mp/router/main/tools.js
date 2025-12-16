// 懒加载组件
const ImageCompressor = () => import('@/mp/components/view/tools/ImageCompressor.vue');
const CreateZIP = () => import('@/mp/components/view/tools/CreateZIP.vue');
const ExtractZIP = () => import('@/mp/components/view/tools/ExtractZIP.vue');
const ImageToText = () => import('@/mp/components/view/tools/ImageToText.vue');
const AllAI = () => import('@/mp/components/view/tools/AllAI.vue');
const ToolsMenu = () => import('@/mp/components/view/tools/ToolsIndex.vue');

// 工具箱路由配置
const createToolsRoutes = (role) => {
  const prefix = role === 'admin' ? 'Admin' : 'User';
  const basePath = `/${role}/tools`;
  
  return [
    {
      path: basePath,
      name: `${prefix}Tools`,
      component: ToolsMenu,
      meta: {
        title: '工具',
        requiresAuth: true,
        role,
        showBack: false
      }
    },
    {
      path: `${basePath}/image-compressor`,
      name: `${prefix}ImageCompressor`,
      component: ImageCompressor,
      meta: {
        title: '图片压缩',
        requiresAuth: true,
        role
      }
    },
    {
      path: `${basePath}/text-recognition`,
      name: `${prefix}TextRecognition`,
      component: ImageToText,
      meta: {
        title: '图片转文字',
        requiresAuth: true,
        role
      }
    },
    {
      path: `${basePath}/file-compressor`,
      name: `${prefix}FileCompressor`,
      component: CreateZIP,
      meta: {
        title: '制作压缩包',
        requiresAuth: true,
        role
      }
    },
    {
      path: `${basePath}/file-extractor`,
      name: `${prefix}FileExtractor`,
      component: ExtractZIP,
      meta: {
        title: '解压压缩包',
        requiresAuth: true,
        role
      }
    },
    {
      path: `${basePath}/ai`,
      name: `${prefix}AllAI`,
      component: AllAI,
      meta: {
        title: 'AI大全',
        requiresAuth: true,
        role
      }
    }
  ];
};

// 合并用户和管理员的工具箱路由
const toolsRoutes = [
  ...createToolsRoutes('user'),
  ...createToolsRoutes('admin')
];

export default toolsRoutes;
