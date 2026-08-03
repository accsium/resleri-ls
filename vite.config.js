import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  base: './',
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        dex: 'dex.html',
        collection: 'collection.html',
        skills: 'skills.html',
        'leader-skills': 'leader-skills.html',
        'support-abilities': 'support-abilities.html',
        events: 'events.html',
        'contest-rotations': 'contest-rotations.html',
        gachas: 'gachas.html',
        test: 'test.html',
      },
      output: {
        manualChunks: {
          vendor: ['vue'],
          marked: ['marked'],
        },
      },
    },
  },
})
