import { createApp, h } from 'vue'
import PageShell from '../components/PageShell.vue'
import EventView from '../views/EventView.vue'
import '../styles/global.css'

createApp({
  render: () => h(PageShell, { navKey: 'navEvents' }, { default: () => h(EventView) }),
}).mount('#app')
