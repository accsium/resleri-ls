import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const slowMode = process.env.SLOW === '1' ? 2000 : 0

function delayMiddleware() {
  return {
    name: 'delay-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (slowMode && (req.url.startsWith('/data/') || req.url.startsWith('/image/'))) {
          setTimeout(() => next(), slowMode)
        } else {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), delayMiddleware()],
  base: './',
})
