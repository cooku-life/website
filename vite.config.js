import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
// import { viteStaticCopy } from 'vite-plugin-static-copy' // 移除引入

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 移除 viteStaticCopy 插件配置
    // viteStaticCopy({
    //   targets: [
    //     {
    //       src: 'public/docs/**/*',
    //       dest: 'docs'
    //     }
    //   ]
    // })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  server: {
    host: '0.0.0.0'
  }
})
