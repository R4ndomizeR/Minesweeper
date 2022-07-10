import { fileURLToPath, URL } from 'url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default ({ mode }) => {

  const isDev = (mode === 'development')

  return defineConfig({
    plugins: [vue()],
    base: isDev ? '/' : '/Minesweeper/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  })

}