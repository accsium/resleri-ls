<script setup>
import { ref, computed, onMounted } from 'vue'
import SortableTable from '../components/SortableTable.vue'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import { useSortTable } from '../composables/useSortTable'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import { fmtDate } from '../utils/date.js'
import { preFetch } from '../router'

const { t } = useI18n()
const { characterIndex, loadIndex } = useCharacterData()

const columns = [
  { key: 'id', label: 'ID', width: 72 },
  { key: 'start_at', label: '开始日期', width: 140 },
  { key: 'end_at', label: '结束日期', width: 140 },
  { key: 'name', label: '卡池名', minWidth: 300 },
  { key: 'characters', label: '角色', minWidth: 100 },
]

const rows = ref([])
const loading = ref(true)
const isEmpty = computed(() => !loading.value && rows.value.length === 0)
const { sortCol, sortDir, onSort, sortItems } = useSortTable({
  defaultCol: 'start_at',
  defaultDir: 'desc',
})

function getSortVal(row, field) {
  if (field === 'id') return row.id
  if (field === 'start_at') return row.start_at
  if (field === 'end_at') return row.end_at
  return row.name || ''
}

const sorted = computed(() => sortItems(rows.value, getSortVal))

const charMap = computed(() => {
  const map = {}
  for (const c of characterIndex.value) {
    map[c.id] = c
  }
  return map
})

onMounted(async () => {
  await loadIndex()
  let data = await preFetch.gachas
  if (!data) {
    const resp = await fetch('data/gachas.json')
    data = await resp.json()
  }
  rows.value = data
  loading.value = false
})
</script>

<template>
  <div class="gacha-wrap">
    <div v-if="loading" class="loading">{{ t('loading') }}</div>
    <div v-else-if="isEmpty" class="loading">{{ t('none') }}</div>
  <SortableTable v-else
    :columns="columns"
    :rows="sorted"
    rowKey="id"
    :frozen="0"
    :sortCol="sortCol"
    :sortDir="sortDir"
    @sort="onSort"
  >
    <template #cell-id="{ row }">{{ row.id }}</template>
    <template #cell-start_at="{ row }">{{ fmtDate(row.start_at) }}</template>
    <template #cell-end_at="{ row }">{{ fmtDate(row.end_at) }}</template>
    <template #cell-name="{ row }">{{ row.name }}</template>
    <template #cell-characters="{ row }">
      <span class="gacha-chars">
        <template v-for="cid in row.character_ids" :key="cid">
          <AvatarDisplay
            v-if="charMap[cid]"
            :indexEntry="charMap[cid]"
            :size="60"
          />
        </template>
      </span>
    </template>
  </SortableTable>
  </div>
</template>

<style scoped>
.gacha-wrap { display: flex; justify-content: center; }
.gacha-wrap :deep(.st-wrap) { height: auto; width: auto; }
.gacha-wrap :deep(.st-table) { width: auto; }
.gacha-wrap :deep(.st-table td) { height: auto; }
.gacha-chars { display: inline-flex; gap: 4px; }
</style>
