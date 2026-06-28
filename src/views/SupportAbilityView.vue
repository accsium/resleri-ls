<script setup>
import { computed, onMounted } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import { useSortTable } from '../composables/useSortTable'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import IconDisplay from '../components/IconDisplay.vue'
import StarsDisplay from '../components/StarsDisplay.vue'
import SortableTable from '../components/SortableTable.vue'

const { characterIndex, indexLoaded, baseCharacterMap, loadIndex } = useCharacterData()
const { currentLang, ATTR_MAP, ATTR_MAP_CN, ATTR_IDS, ROLE_MAP, ROLE_MAP_CN } = useI18n()

const columns = [
  { key: 'id', label: 'ID', width: 72 },
  { key: 'avatar', label: '头像', width: 52 },
  { key: 'name', label: '角色名', minWidth: 200 },
  { key: 'attr', label: '属性', width: 56, align: 'center' },
  { key: 'role', label: '职业', width: 56, align: 'center' },
  { key: 'maxRarity', label: '最大星级', width: 80, align: 'center' },
  { key: 'saAttr', label: '目标属性', width: 56, align: 'center' },
  { key: 'saRole', label: '目标职业', width: 56, align: 'center' },
  { key: 'saTag', label: '目标标签', minWidth: 100 },
  { key: 'saDesc', label: '支援能力描述', minWidth: 400 },
]

const attrMap = computed(() => currentLang.value === 'cn' ? ATTR_MAP_CN : ATTR_MAP)
const roleMap = computed(() => currentLang.value === 'cn' ? ROLE_MAP_CN : ROLE_MAP)
const charIndexMap = computed(() => {
  const m = {}; for (const c of characterIndex.value) m[c.id] = c; return m
})

const chars = computed(() =>
  characterIndex.value.filter(c => c.support_ability?.description != null)
)

const { sortCol, sortDir, onSort, sortItems } = useSortTable({
  defaultCol: 'uid',
  defaultDir: 'desc',
  avatarAlias: 'uid',
})

function baseName(row, lang) {
  const bc = baseCharacterMap.value[row.base_character_id]
  if (!bc) return ''
  return lang === 'cn' ? (bc.name_cn || bc.name_ja) : bc.name_ja
}

function getSortVal(row, field) {
  switch (field) {
    case 'uid':
    case 'avatar': return row.uid || ''
    case 'id': return row.id
    case 'name': return baseName(row, currentLang.value)
    case 'attr': return row.attack_attributes?.[0] ? ATTR_IDS.indexOf(row.attack_attributes[0]) : 999
    case 'role': return row.role || 999
    case 'maxRarity': return row.max_rarity || 0
    case 'saAttr': return row.support_ability?.attr != null ? ATTR_IDS.indexOf(row.support_ability.attr) : 999
    case 'saRole': return row.support_ability?.role || 999
    case 'saTag': return row.support_ability?.tag || '￿'
    case 'saDesc': return row.support_ability?.description || ''
    default: return ''
  }
}

const sortedChars = computed(() => sortItems(chars.value, getSortVal))

function attrName(id) { return attrMap.value[id] || '' }
function roleName(id) { return roleMap.value[id] || '' }

onMounted(() => { loadIndex() })
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
    <template #cell-id="{ row }">{{ row.id }}</template>
    <template #cell-avatar="{ row }">
      <div style="text-align:center;line-height:0">
        <AvatarDisplay v-if="charIndexMap[row.id]" :indexEntry="charIndexMap[row.id]" :size="36" />
      </div>
    </template>
    <template #cell-name="{ row }">
      {{ baseName(row, currentLang) }}<template v-if="row.another_name"> <span class="alias-text">{{ row.another_name }}</span></template>
    </template>
    <template #cell-attr="{ row }">
      <IconDisplay v-if="(row.attack_attributes || [])[0]" type="attribute" :id="(row.attack_attributes || [])[0]" :size="24" />
    </template>
    <template #cell-role="{ row }">
      <IconDisplay v-if="row.role" type="role" :id="row.role" :size="24" />
    </template>
    <template #cell-maxRarity="{ row }">
      <StarsDisplay :mode="1" :rarity="row.max_rarity" :max-rarity="8" :scale="0.25" />
    </template>
    <template #cell-saAttr="{ row }">
      <IconDisplay v-if="row.support_ability?.attr" type="attribute" :id="row.support_ability.attr" :size="24" />
    </template>
    <template #cell-saRole="{ row }">
      <IconDisplay v-if="row.support_ability?.role" type="role" :id="row.support_ability.role" :size="24" />
    </template>
    <template #cell-saTag="{ row }">
      <template v-if="row.support_ability?.tag">
        <span v-for="(t, i) in row.support_ability.tag.split('、')" :key="`${row.id}-tag-${i}`" class="tag">{{ t }}</span>
      </template>
    </template>
    <template #cell-saDesc="{ row }">
      <span v-html="row.support_ability?.description"></span>
    </template>
  </SortableTable>
</template>

<style scoped>
:deep(.st-table td) {
  white-space: nowrap;
  height: auto;
}
.tag {
  background: var(--bg-trait);
  color: var(--text-primary);
}
</style>
