import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  // 开发环境代理目标：优先使用环境变量，否则默认 127.0.0.1
  const backendHost = env.VITE_BACKEND_HOST || '127.0.0.1'
  const backendPort = env.VITE_BACKEND_PORT || '661'
  const frontendPort = Number(env.VITE_FRONTEND_PORT) || 662

  return {
    plugins: [
      vue(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: './index.html',
          pc: './pc.html',
          mp: './mp.html',
        },
      }
    },
    server: {
      port: frontendPort,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true
        },
        '/sample': {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true
        },
        '/baidu-api': {
          target: 'https://aip.baidubce.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/baidu-api/, '')
        }
      }
    }
  }
})
