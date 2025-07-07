import { RouteRecordRaw } from 'vue-router';
import ImageCompressor from '@/pc/components/tools/ImageCompressor.vue';
import FileCompressor from '@/pc/components/tools/CreateZIP.vue';
import FileExtractor from '@/pc/components/tools/ExtractZIP.vue';
import TextRecognition from '@/pc/components/tools/ImageToText.vue';
import AllAI from '@/pc/components/tools/AllAI.vue';

// 工具箱路由配置 - 共享组件
const createToolsRoutes = (role: 'user' | 'admin'): RouteRecordRaw => {
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
const toolsRoutes: RouteRecordRaw[] = [
  createToolsRoutes('user'),
  createToolsRoutes('admin')
];

export default toolsRoutes; 