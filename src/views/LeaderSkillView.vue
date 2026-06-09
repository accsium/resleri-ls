<script setup>
import { ref, computed } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import SortableTable from '../components/SortableTable.vue'

const { characterIndex } = useCharacterData()
const { currentLang, ATTR_MAP, ATTR_MAP_CN, ATTR_IDS, ROLE_MAP, ROLE_MAP_CN } = useI18n()

const attrMap = computed(() => currentLang.value === 'cn' ? ATTR_MAP_CN : ATTR_MAP)
const roleMap = computed(() => currentLang.value === 'cn' ? ROLE_MAP_CN : ROLE_MAP)

const columns = [
  { key: 'id', label: 'ID', width: 72 },
  { key: 'avatar', label: '角色头像', width: 88 },
  { key: 'name', label: '角色名', minWidth: 240 },
  { key: 'attr', label: '属性', width: 56, align: 'center' },
  { key: 'role', label: '职业', width: 56, align: 'center' },
  { key: 'skillName', label: '队长技能', minWidth: 240 },
  { key: 'skillDesc', label: '效果', minWidth: 300 },
]

const leaderChars = computed(() =>
  characterIndex.value.filter(c => c.leader_skill_name != null)
)

const sortPriority = ref(['uid'])
const sortDirs = ref({ uid: 'desc' })
const sortCol = computed(() => sortPriority.value[0] || 'uid')
const sortDir = computed(() => sortDirs.value[sortCol.value] || 'desc')

function getSortVal(row, field) {
  const cn = currentLang.value === 'cn'
  switch (field) {
    case 'uid':
    case 'avatar': return row.uid || ''
    case 'id': return row.id
    case 'name': return (cn ? row.base_character_name_cn : row.base_character_name_ja) || ''
    case 'attr': return row.attack_attributes?.[0] ? ATTR_IDS.indexOf(row.attack_attributes[0]) : 999
    case 'role': return row.role || 999
    case 'skillName': return row.leader_skill_name || ''
    case 'skillDesc': return row.leader_skill_description || ''
    default: return ''
  }
}

function cmpVal(va, vb, dir) {
  if (va == null && vb == null) return 0
  if (va == null) return 1
  if (vb == null) return -1
  if (typeof va === 'string') { const c = va.localeCompare(vb); return c ? c * dir : 0 }
  if (va < vb) return -1 * dir
  if (va > vb) return 1 * dir
  return 0
}

const sortedChars = computed(() => {
  const list = [...leaderChars.value]
  list.sort((a, b) => {
    for (const field of sortPriority.value) {
      const d = (sortDirs.value[field] || 'desc') === 'desc' ? -1 : 1
      const r = cmpVal(getSortVal(a, field), getSortVal(b, field), d)
      if (r !== 0) return r
    }
    return 0
  })
  return list
})

function onSort(col) {
  if (col === 'avatar') col = 'uid'
  const cur = [...sortPriority.value]
  const idx = cur.indexOf(col)
  if (idx === 0) {
    sortDirs.value[col] = sortDirs.value[col] === 'asc' ? 'desc' : 'asc'
  } else {
    if (idx > 0) cur.splice(idx, 1)
    cur.unshift(col)
    sortPriority.value = cur
    if (!sortDirs.value[col]) sortDirs.value[col] = 'desc'
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
      {{ currentLang === 'cn' ? row.base_character_name_cn : row.base_character_name_ja }}<template v-if="row.another_name"> <span style="font-size:11px;color:var(--text-muted)">{{ row.another_name }}</span></template>
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
