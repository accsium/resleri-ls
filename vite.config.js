import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function getBuildTime() {
  return new Date().toISOString()
}

export default defineConfig({
  plugins: [vue()],
  base: './',
  define: {
    __BUILD_TIME__: JSON.stringify(getBuildTime()),
  },
})
