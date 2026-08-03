import { createApp, h } from 'vue'
import PageShell from '../components/PageShell.vue'
import SupportAbilityView from '../views/SupportAbilityView.vue'
import '../styles/global.css'

createApp({
  render: () => h(PageShell, { navKey: 'navSupportAbility' }, { default: () => h(SupportAbilityView) }),
}).mount('#app')
