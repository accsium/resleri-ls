<script setup>
import { computed, onMounted } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import IconDisplay from '../components/IconDisplay.vue'
import StarsDisplay from '../components/StarsDisplay.vue'
import SortableTable from '../components/SortableTable.vue'

const { characterIndex, indexLoaded, baseCharacterMap, loadIndex, attrMap: attrData, roleMap: roleData } = useCharacterData()
const { t, currentLang, getField, ATTR_IDS } = useI18n()

const columns = computed(() => [
  { key: 'id', label: t('id'), width: 72 },
  { key: 'avatar', label: t('avatar'), width: 60 },
  { key: 'name', label: t('characterName'), minWidth: 200, sortVal: (row) => baseName(row, currentLang.value) },
  { key: 'attr', label: t('attribute'), width: 56, align: 'center', sortVal: (row) => row.attack_attributes?.[0] ? ATTR_IDS.indexOf(row.attack_attributes[0]) : 999 },
  { key: 'role', label: t('role'), width: 56, align: 'center', sortVal: (row) => row.role || 999 },
  { key: 'maxRarity', label: t('maxRarity'), width: 80, align: 'center', sortVal: (row) => row.max_rarity || 0 },
  { key: 'saAttr', label: t('targetAttr'), width: 56, align: 'center', sortVal: (row) => row.support_ability?.attr != null ? ATTR_IDS.indexOf(row.support_ability.attr) : 999 },
  { key: 'saRole', label: t('targetRole'), width: 56, align: 'center', sortVal: (row) => row.support_ability?.role || 999 },
  { key: 'saTag', label: t('targetTag'), minWidth: 100, sortVal: (row) => row.support_ability?.tag || '￿' },
  { key: 'saDesc', label: t('supportAbilityDesc'), minWidth: 400, sortVal: (row) => row.support_ability?.description || '' },
])

const attrMap = computed(() => {
  const m = {}
  for (const [id, entry] of Object.entries(attrData.value)) {
    m[id] = getField(entry, 'name')
  }
  return m
})
const roleMap = computed(() => {
  const m = {}
  for (const [id, entry] of Object.entries(roleData.value)) {
    m[id] = getField(entry, 'name')
  }
  return m
})
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
  <div v-if="!indexLoaded" class="loading">{{ t('loading') }}</div>
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
        <AvatarDisplay v-if="charIndexMap[row.id]" :indexEntry="charIndexMap[row.id]" :size="3" />
      </div>
    </template>
    <template #cell-name="{ row }">
      {{ baseName(row, currentLang) }}<template v-if="row.another_name"> <span class="alias-text">{{ row.another_name }}</span></template>
    </template>
    <template #cell-attr="{ row }">
      <IconDisplay v-if="(row.attack_attributes || [])[0]" type="attribute" :id="(row.attack_attributes || [])[0]" :size="0" />
    </template>
    <template #cell-role="{ row }">
      <IconDisplay v-if="row.role" type="role" :id="row.role" :size="1" />
    </template>
    <template #cell-maxRarity="{ row }">
      <StarsDisplay :mode="1" :rarity="row.max_rarity" :max-rarity="8" :scale="0.25" />
    </template>
    <template #cell-saAttr="{ row }">
      <IconDisplay v-if="row.support_ability?.attr" type="attribute" :id="row.support_ability.attr" :size="0" />
    </template>
    <template #cell-saRole="{ row }">
      <IconDisplay v-if="row.support_ability?.role" type="role" :id="row.support_ability.role" :size="1" />
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
