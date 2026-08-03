import { createApp, h } from 'vue'
import PageShell from '../components/PageShell.vue'
import SkillListView from '../views/SkillListView.vue'
import '../styles/global.css'

createApp({
  render: () => h(PageShell, { navKey: 'navSkills' }, { default: () => h(SkillListView) }),
}).mount('#app')
