import { createApp, h } from 'vue'
import PageShell from '../components/PageShell.vue'
import ContestRotationView from '../views/ContestRotationView.vue'
import '../styles/global.css'

createApp({
  render: () => h(PageShell, { navKey: 'navContest' }, { default: () => h(ContestRotationView) }),
}).mount('#app')
