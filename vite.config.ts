import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { SERVER_CONFIG, EXTERNAL_APIS } from './src/config/env'

// https://vitejs.dev/config/
export default defineConfig({
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
    port: Number(SERVER_CONFIG.FRONTEND_PORT),
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: `http://${SERVER_CONFIG.BACKEND_HOST}:${SERVER_CONFIG.BACKEND_PORT}`,
        changeOrigin: true
      },
      '/sample': {
        target: `http://${SERVER_CONFIG.BACKEND_HOST}:${SERVER_CONFIG.BACKEND_PORT}`,
        changeOrigin: true
      },
      '/baidu-api': {
        target: EXTERNAL_APIS.BAIDU_API.BASE_URL,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/baidu-api/, '')
      }
    }
  }
})