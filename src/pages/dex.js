import { createApp, h } from 'vue'
import PageShell from '../components/PageShell.vue'
import DexView from '../views/DexView.vue'
import '../styles/global.css'

createApp({
  render: () => h(PageShell, { navKey: 'navGuide' }, { default: () => h(DexView) }),
}).mount('#app')
