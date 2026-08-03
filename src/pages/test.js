import { createApp, h } from 'vue'
import PageShell from '../components/PageShell.vue'
import TestView from '../views/TestView.vue'
import '../styles/global.css'

createApp({
  render: () => h(PageShell, { navKey: 'navTest' }, { default: () => h(TestView) }),
}).mount('#app')
