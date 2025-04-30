import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy' // 引入插件

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({ // 配置插件
      targets: [
        {
          src: 'public/docs/**/*', // 复制 docs 目录下所有文件和子目录
          dest: 'docs'     // 复制到输出目录下的 docs 文件夹
        }
      ]
    })
  ]
})
