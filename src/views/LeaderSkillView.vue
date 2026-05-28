<script setup>
import { ref, computed } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import SortableTable from '../components/SortableTable.vue'

const { characterIndex } = useCharacterData()
const { currentLang, ATTR_MAP, ATTR_MAP_CN, ROLE_MAP, ROLE_MAP_CN } = useI18n()

const attrMap = computed(() => currentLang.value === 'cn' ? ATTR_MAP_CN : ATTR_MAP)
const roleMap = computed(() => currentLang.value === 'cn' ? ROLE_MAP_CN : ROLE_MAP)

const columns = [
  { key: 'id', label: 'ID', width: 72 },
  { key: 'avatar', label: '角色头像', width: 88 },
  { key: 'name', label: '角色名', minWidth: 100 },
  { key: 'attr', label: '属性', width: 68, align: 'center' },
  { key: 'role', label: '职业', width: 68, align: 'center' },
  { key: 'skillName', label: '队长技能', minWidth: 100 },
  { key: 'skillDesc', label: '效果', minWidth: 200 },
]

const leaderChars = computed(() =>
  characterIndex.value.filter(c => c.leader_skill_name != null)
)

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
    const r = cmpVal(a[field], b[field], dir)
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
</script>

<template>
  <SortableTable
    :columns="columns"
    :rows="sortedChars"
    rowKey="id"
    :frozen="2"
    :sortCol="sortCol"
    :sortDir="sortDir"
    @sort="onSort"
  >
    <template #cell-avatar="{ row }">
      <div class="ls-avatar-cell">
        <AvatarDisplay :indexEntry="row" :size="72" />
      </div>
    </template>
    <template #cell-name="{ row }">
      {{ currentLang === 'cn' ? row.base_character_name_cn : row.base_character_name_ja }}<template v-if="row.another_name"> {{ row.another_name }}</template>
    </template>
    <template #cell-attr="{ row }">
      {{ (row.attack_attributes || []).map(a => attrMap[a] || a).join(' ') }}
    </template>
    <template #cell-role="{ row }">
      {{ roleMap[row.role] || row.role }}
    </template>
    <template #cell-skillName="{ row }">
      {{ row.leader_skill_name }}
    </template>
    <template #cell-skillDesc="{ row }">
      {{ row.leader_skill_description }}
    </template>
  </SortableTable>
</template>

<style scoped>
.ls-avatar-cell {
  text-align: center;
  line-height: 0;
}
</style>
