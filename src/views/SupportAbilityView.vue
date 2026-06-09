<script setup>
import { ref, computed } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import IconDisplay from '../components/IconDisplay.vue'
import StarsDisplay from '../components/StarsDisplay.vue'
import SortableTable from '../components/SortableTable.vue'

const { characterIndex } = useCharacterData()
const { currentLang, getField, ATTR_MAP, ATTR_MAP_CN, ATTR_IDS, ROLE_MAP, ROLE_MAP_CN } = useI18n()

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
  characterIndex.value.filter(c => c.support_ability_description != null)
)

const sortCol = ref('id')
const sortDir = ref('asc')

const sortedChars = computed(() => {
  const list = [...chars.value]
  const dir = sortDir.value === 'desc' ? -1 : 1
  const cn = currentLang.value === 'cn'

  list.sort((a, b) => {
    let va, vb
    switch (sortCol.value) {
      case 'id': va = a.id; vb = b.id; break
      case 'name': va = cn ? a.base_character_name_cn : a.base_character_name_ja || ''; vb = cn ? b.base_character_name_cn : b.base_character_name_ja || ''; break
      case 'attr': va = a.attack_attributes?.[0] ? ATTR_IDS.indexOf(a.attack_attributes[0]) : 999; vb = b.attack_attributes?.[0] ? ATTR_IDS.indexOf(b.attack_attributes[0]) : 999; break
      case 'role': va = a.role || 999; vb = b.role || 999; break
      case 'maxRarity': va = a.max_rarity || 0; vb = b.max_rarity || 0; break
      case 'saAttr': va = a.support_ability_attr != null ? ATTR_IDS.indexOf(a.support_ability_attr) : 999; vb = b.support_ability_attr != null ? ATTR_IDS.indexOf(b.support_ability_attr) : 999; break
      case 'saRole': va = a.support_ability_role || 999; vb = b.support_ability_role || 999; break
      case 'saTag': va = (cn ? a.support_ability_tag_cn : a.support_ability_tag_ja) || '￿'; vb = (cn ? b.support_ability_tag_cn : b.support_ability_tag_ja) || '￿'; break
      case 'saDesc': va = a.support_ability_description || ''; vb = b.support_ability_description || ''; break
      default: va = a.id; vb = b.id
    }
    if (typeof va === 'string' && typeof vb === 'string') { const c = va.localeCompare(vb); if (c !== 0) return c * dir }
    else { if (va < vb) return -1 * dir; if (va > vb) return 1 * dir }
    return (a.id - b.id) * dir
  })
  return list
})

function onSort(col) {
  if (sortCol.value === col) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortCol.value = col
    sortDir.value = 'asc'
  }
}

function attrName(id) {
  return attrMap.value[id] || ''
}
function roleName(id) {
  return roleMap.value[id] || ''
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
    <template #cell-id="{ row }">{{ row.id }}</template>
    <template #cell-avatar="{ row }">
      <div style="text-align:center;line-height:0">
        <AvatarDisplay v-if="charIndexMap[row.id]" :indexEntry="charIndexMap[row.id]" :size="36" />
      </div>
    </template>
    <template #cell-name="{ row }">
      {{ currentLang === 'cn' ? row.base_character_name_cn : row.base_character_name_ja }}<template v-if="row.another_name"> <span style="font-size:11px;color:var(--text-muted)">{{ row.another_name }}</span></template>
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
      <IconDisplay v-if="row.support_ability_attr" type="attribute" :id="row.support_ability_attr" :size="24" />
    </template>
    <template #cell-saRole="{ row }">
      <IconDisplay v-if="row.support_ability_role" type="role" :id="row.support_ability_role" :size="24" />
    </template>
    <template #cell-saTag="{ row }">
      <template v-if="getField(row, 'support_ability_tag')">
        <span v-for="(t, i) in getField(row, 'support_ability_tag').split('、')" :key="i" class="tag">{{ t }}</span>
      </template>
    </template>
    <template #cell-saDesc="{ row }">{{ row.support_ability_description }}</template>
  </SortableTable>
</template>

<style scoped>
:deep(.st-table td) {
  white-space: nowrap;
  height: auto;
}
.tag {
  background: #c8c0b0;
  color: var(--text-primary);
}
</style>
