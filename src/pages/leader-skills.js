import { createApp, h } from 'vue'
import PageShell from '../components/PageShell.vue'
import LeaderSkillView from '../views/LeaderSkillView.vue'
import '../styles/global.css'

createApp({
  render: () => h(PageShell, { navKey: 'navLeaderSkills' }, { default: () => h(LeaderSkillView) }),
}).mount('#app')
