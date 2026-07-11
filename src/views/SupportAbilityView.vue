<script setup>
import { computed, onMounted } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import IconDisplay from '../components/IconDisplay.vue'
import StarsDisplay from '../components/StarsDisplay.vue'
import SortableTable from '../components/SortableTable.vue'

const { characterIndex, indexLoaded, baseCharacterMap, loadIndex } = useCharacterData()
const { currentLang, ATTR_MAP, ATTR_MAP_CN, ATTR_IDS, ROLE_MAP, ROLE_MAP_CN } = useI18n()

const columns = [
  { key: 'id', label: 'ID', width: 72 },
  { key: 'avatar', label: '头像', width: 60 },
  { key: 'name', label: '角色名', minWidth: 200, sortVal: (row) => baseName(row, currentLang.value) },
  { key: 'attr', label: '属性', width: 56, align: 'center', sortVal: (row) => row.attack_attributes?.[0] ? ATTR_IDS.indexOf(row.attack_attributes[0]) : 999 },
  { key: 'role', label: '职业', width: 56, align: 'center', sortVal: (row) => row.role || 999 },
  { key: 'maxRarity', label: '最大星级', width: 80, align: 'center', sortVal: (row) => row.max_rarity || 0 },
  { key: 'saAttr', label: '目标属性', width: 56, align: 'center', sortVal: (row) => row.support_ability?.attr != null ? ATTR_IDS.indexOf(row.support_ability.attr) : 999 },
  { key: 'saRole', label: '目标职业', width: 56, align: 'center', sortVal: (row) => row.support_ability?.role || 999 },
  { key: 'saTag', label: '目标标签', minWidth: 100, sortVal: (row) => row.support_ability?.tag || '￿' },
  { key: 'saDesc', label: '支援能力描述', minWidth: 400, sortVal: (row) => row.support_ability?.description || '' },
]

const attrMap = computed(() => currentLang.value === 'cn' ? ATTR_MAP_CN : ATTR_MAP)
const roleMap = computed(() => currentLang.value === 'cn' ? ROLE_MAP_CN : ROLE_MAP)
const charIndexMap = computed(() => {
  const m = {}; for (const c of characterIndex.value) m[c.id] = c; return m
})

const chars = computed(() =>
  characterIndex.value.filter(c => c.support_ability?.description != null)
)

function baseName(row, lang) {
  const bc = baseCharacterMap.value[row.base_character_id]
  if (!bc) return ''
  return lang === 'cn' ? (bc.name_cn || bc.name_ja) : bc.name_ja
}

function attrName(id) { return attrMap.value[id] || '' }
function roleName(id) { return roleMap.value[id] || '' }

onMounted(() => { loadIndex() })
</script>

<template>
  <div v-if="!indexLoaded" class="loading">加载角色数据中...</div>
  <SortableTable v-else
    :columns="columns"
    :rows="chars"
    rowKey="id"
    :frozen="2"
    defaultSortCol="uid"
    defaultSortDir="desc"
    avatarAlias="uid"
  >
    <template #cell-id="{ row }">{{ row.id }}</template>
    <template #cell-avatar="{ row }">
      <div style="text-align:center;line-height:0">
        <AvatarDisplay v-if="charIndexMap[row.id]" :indexEntry="charIndexMap[row.id]" :size="48" />
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
