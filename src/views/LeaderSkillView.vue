<script setup>
import { computed, onMounted } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import { useSortTable } from '../composables/useSortTable'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import SortableTable from '../components/SortableTable.vue'

const { characterIndex, indexLoaded, baseCharacterMap, loadIndex } = useCharacterData()
const { t, currentLang, ATTR_MAP, ATTR_MAP_CN, ATTR_IDS, ROLE_MAP, ROLE_MAP_CN } = useI18n()

const attrMap = computed(() => currentLang.value === 'cn' ? ATTR_MAP_CN : ATTR_MAP)
const roleMap = computed(() => currentLang.value === 'cn' ? ROLE_MAP_CN : ROLE_MAP)

const columns = [
  { key: 'id', label: 'ID', width: 72 },
  { key: 'avatar', label: '角色头像', width: 88 },
  { key: 'name', label: '角色名', minWidth: 240 },
  { key: 'attr', label: '属性', width: 56, align: 'center' },
  { key: 'role', label: '职业', width: 56, align: 'center' },
  { key: 'skillName', label: '队长技能', minWidth: 200 },
  { key: 'skillDesc', label: '效果', minWidth: 300 },
]

const leaderChars = computed(() =>
  characterIndex.value.filter(c => c.leader_skill?.description != null)
)

const { sortCol, sortDir, onSort, sortItems } = useSortTable({
  defaultCol: 'uid',
  defaultDir: 'desc',
  avatarAlias: 'uid',
})

function getSortVal(row, field) {
  switch (field) {
    case 'uid':
    case 'avatar': return row.uid || ''
    case 'id': return row.id
    case 'name': return baseName(row)
    case 'attr': return row.attack_attributes?.[0] ? ATTR_IDS.indexOf(row.attack_attributes[0]) : 999
    case 'role': return row.role || 999
    case 'skillName': return row.leader_skill?.name || ''
    case 'skillDesc': return row.leader_skill?.description || ''
    default: return ''
  }
}

function baseName(row) {
  const bc = baseCharacterMap.value[row.base_character_id]
  if (!bc) return ''
  return currentLang.value === 'cn' ? (bc.name_cn || bc.name_ja) : bc.name_ja
}

const sortedChars = computed(() => sortItems(leaderChars.value, getSortVal))

onMounted(() => { loadIndex() })
</script>

<template>
  <div v-if="!indexLoaded" class="loading">加载角色数据中...</div>
  <SortableTable v-else
    :columns="columns"
    :rows="sortedChars"
    :frozen="2"
    :sort-col="sortCol"
    :sort-dir="sortDir"
    @sort="onSort"
  >
    <template #cell-avatar="{ row }">
      <AvatarDisplay :index-entry="row" :size="60" feature="full" />
    </template>
    <template #cell-name="{ row }">
      {{ baseName(row) }}<template v-if="row.another_name"> <span class="alias-text">{{ row.another_name }}</span></template>
    </template>
    <template #cell-attr="{ row }">
      <span v-if="row.attack_attributes?.[0]">{{ attrMap[row.attack_attributes[0]] || row.attack_attributes[0] }}</span>
    </template>
    <template #cell-role="{ row }">
      {{ roleMap[row.role] || row.role }}
    </template>
    <template #cell-skillName="{ row }">
      {{ row.leader_skill?.name }}
    </template>
    <template #cell-skillDesc="{ row }">
      <span v-html="row.leader_skill?.description"></span>
    </template>
  </SortableTable>
</template>

<style scoped>
</style>
