<script setup>
import { computed, onMounted } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import IconDisplay from '../components/IconDisplay.vue'
import SortableTable from '../components/SortableTable.vue'

const { characterIndex, indexLoaded, baseCharacterMap, loadIndex, attrMap: attrData, roleMap: roleData } = useCharacterData()
const { t, currentLang, getField, ATTR_IDS } = useI18n()
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

const columns = computed(() => [
  { key: 'id', label: t('id'), width: 72 },
  { key: 'avatar', label: t('avatar'), width: 60 },
  { key: 'name', label: t('characterName'), minWidth: 240, sortVal: (row) => baseName(row) },
  { key: 'attr', label: t('attribute'), width: 56, align: 'center', sortVal: (row) => row.attack_attributes?.[0] ? ATTR_IDS.indexOf(row.attack_attributes[0]) : 999 },
  { key: 'role', label: t('role'), width: 56, align: 'center', sortVal: (row) => row.role || 999 },
  { key: 'skillName', label: t('leaderSkillSection'), minWidth: 200, sortVal: (row) => row.leader_skill?.name || '' },
  { key: 'skillDesc', label: t('effectLabel'), minWidth: 300, sortVal: (row) => row.leader_skill?.description || '' },
])

const leaderChars = computed(() =>
  characterIndex.value.filter(c => c.leader_skill?.description != null)
)

function baseName(row) {
  const bc = baseCharacterMap.value[row.base_character_id]
  if (!bc) return ''
  return currentLang.value === 'cn' ? (bc.name_cn || bc.name_ja) : bc.name_ja
}

onMounted(() => { loadIndex() })
</script>

<template>
  <div v-if="!indexLoaded" class="loading">{{ t('loading') }}</div>
  <SortableTable v-else
    :columns="columns"
    :rows="leaderChars"
    :frozen="2"
    defaultSortCol="uid"
    defaultSortDir="desc"
    avatarAlias="uid"
  >
    <template #cell-avatar="{ row }">
      <AvatarDisplay :index-entry="row" :size="3" feature="full" />
    </template>
    <template #cell-name="{ row }">
      {{ baseName(row) }}<template v-if="row.another_name"> <span class="alias-text">{{ row.another_name }}</span></template>
    </template>
    <template #cell-attr="{ row }">
      <IconDisplay v-if="row.attack_attributes?.[0]" type="attribute" :id="row.attack_attributes[0]" :size="0" />
    </template>
    <template #cell-role="{ row }">
      <IconDisplay v-if="row.role" type="role" :id="row.role" :size="1" />
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
