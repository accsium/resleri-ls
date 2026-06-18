<script setup>
import { computed } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import { useSortTable } from '../composables/useSortTable'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import SortableTable from '../components/SortableTable.vue'

const { characterIndex, indexLoaded } = useCharacterData()
const { currentLang, getField, ATTR_MAP, ATTR_MAP_CN, ATTR_IDS, ROLE_MAP, ROLE_MAP_CN } = useI18n()

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
    case 'name': return getField(row, 'base_character_name')
    case 'attr': return row.attack_attributes?.[0] ? ATTR_IDS.indexOf(row.attack_attributes[0]) : 999
    case 'role': return row.role || 999
    case 'skillName': return row.leader_skill_name || ''
    case 'skillDesc': return row.leader_skill_description || ''
    default: return ''
  }
}

const sortedChars = computed(() => sortItems(leaderChars.value, getSortVal))
</script>

<template>
  <div v-if="!indexLoaded" class="loading">加载角色数据中...</div>
  <SortableTable v-else
    :columns="columns"
    :rows="sortedChars"
    rowKey="id"
    :frozen="2"
    :autoHeight="true"
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
</style>
