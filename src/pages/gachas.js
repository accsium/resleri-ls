import { createApp, h } from 'vue'
import PageShell from '../components/PageShell.vue'
import GachaView from '../views/GachaView.vue'
import '../styles/global.css'

createApp({
  render: () => h(PageShell, { navKey: 'navGachas' }, { default: () => h(GachaView) }),
}).mount('#app')
