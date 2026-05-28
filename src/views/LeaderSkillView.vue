<script setup>
import { ref, computed } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import AvatarDisplay from '../components/AvatarDisplay.vue'

const { characterIndex } = useCharacterData()
const { currentLang, ATTR_MAP, ATTR_MAP_CN, ROLE_MAP, ROLE_MAP_CN } = useI18n()

const attrMap = computed(() => currentLang.value === 'cn' ? ATTR_MAP_CN : ATTR_MAP)
const roleMap = computed(() => currentLang.value === 'cn' ? ROLE_MAP_CN : ROLE_MAP)

const leaderChars = computed(() =>
  characterIndex.value.filter(c => c.leader_skill_name != null)
)

// 角色页默认排序优先级
const DEFAULT_PRIORITY = [
  { field: 'start_at' },
  { field: 'initial_rarity' },
  { field: 'id' },
]

const sortCol = ref('default')
const sortDir = ref('desc')

function cmpVal(va, vb, dir) {
  if (va == null && vb == null) return 0
  if (va == null) return 1 * dir
  if (vb == null) return -1 * dir
  if (typeof va === 'string') {
    const c = va.localeCompare(vb)
    return c ? c * dir : 0
  }
  if (va < vb) return -1 * dir
  if (va > vb) return 1 * dir
  return 0
}

function defaultCompare(a, b, dir) {
  for (const { field } of DEFAULT_PRIORITY) {
    const va = a[field]
    const vb = b[field]
    const r = cmpVal(va, vb, dir)
    if (r !== 0) return r
  }
  return 0
}

const sortedChars = computed(() => {
  const list = [...leaderChars.value]
  const dir = sortDir.value === 'desc' ? -1 : 1

  if (sortCol.value === 'default') {
    list.sort((a, b) => defaultCompare(a, b, dir))
    return list
  }

  list.sort((a, b) => {
    let va, vb
    switch (sortCol.value) {
      case 'name':
        va = currentLang.value === 'cn' ? a.base_character_name_cn : a.base_character_name_ja
        vb = currentLang.value === 'cn' ? b.base_character_name_cn : b.base_character_name_ja
        break
      case 'attr':
        va = a.attack_attributes?.[0] || 0
        vb = b.attack_attributes?.[0] || 0
        break
      case 'role':
        va = a.role || 0
        vb = b.role || 0
        break
      case 'id':
        va = a.id
        vb = b.id
        break
      case 'skillName':
        va = a.leader_skill_name || ''
        vb = b.leader_skill_name || ''
        break
      case 'skillDesc':
        va = a.leader_skill_description || ''
        vb = b.leader_skill_description || ''
        break
      default:
        return 0
    }
    const r = cmpVal(va, vb, dir)
    if (r !== 0) return r
    return defaultCompare(a, b, dir)
  })
  return list
})

function onSort(col) {
  if (sortCol.value === col) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortCol.value = col
    sortDir.value = 'desc'
  }
}

function sortArrow(col) {
  if (sortCol.value !== col) return ''
  return sortDir.value === 'desc' ? ' ▼' : ' ▲'
}
</script>

<template>
  <div class="ls-table-wrap">
    <table class="ls-table">
      <thead>
        <tr>
          <th @click="onSort('id')">ID{{ sortArrow('id') }}</th>
          <th @click="onSort('default')">角色头像{{ sortArrow('default') }}</th>
          <th @click="onSort('attr')">属性{{ sortArrow('attr') }}</th>
          <th @click="onSort('role')">职业{{ sortArrow('role') }}</th>
          <th @click="onSort('name')">角色名{{ sortArrow('name') }}</th>
          <th @click="onSort('skillName')">队长技能{{ sortArrow('skillName') }}</th>
          <th @click="onSort('skillDesc')">效果{{ sortArrow('skillDesc') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in sortedChars" :key="c.id">
          <td>{{ c.id }}</td>
          <td class="ls-td-avatar"><AvatarDisplay :indexEntry="c" :size="72" /></td>
          <td>{{ (c.attack_attributes || []).map(a => attrMap[a] || a).join(' ') }}</td>
          <td>{{ roleMap[c.role] || c.role }}</td>
          <td>{{ currentLang === 'cn' ? c.base_character_name_cn : c.base_character_name_ja }}<template v-if="c.another_name"> {{ c.another_name }}</template></td>
          <td>{{ c.leader_skill_name }}</td>
          <td>{{ c.leader_skill_description }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
