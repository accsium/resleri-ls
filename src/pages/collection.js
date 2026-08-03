import { createApp, h } from 'vue'
import PageShell from '../components/PageShell.vue'
import CollectionView from '../views/CollectionView.vue'
import '../styles/global.css'

createApp({
  render: () => h(PageShell, { navKey: 'navCollection' }, { default: () => h(CollectionView) }),
}).mount('#app')
