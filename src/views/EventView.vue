<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import SortableTable from '../components/SortableTable.vue'
import { useSortTable } from '../composables/useSortTable'
import { useI18n } from '../composables/useI18n'
import { fmtDate } from '../utils/date.js'
import { preFetch } from '../router'

const columns = [
  { key: 'id', label: 'ID', width: 72 },
  { key: 'start_at', label: '开始日期', width: 140 },
  { key: 'end_at', label: '结束日期', width: 140 },
  { key: 'name', label: '名称', minWidth: 480 },
  { key: 'revival_start_at', label: '复刻日期', width: 140 },
]

const groups = [
  { label: '2026', min: 135, max: Infinity },
  { label: '2025', min: 77, max: 134 },
  { label: '2024', min: 10, max: 76 },
  { label: '2023', min: 1, max: 9 },
]

const allRows = ref([])
const loading = ref(true)
const isEmpty = computed(() => !loading.value && allRows.value.length === 0)

const getGroupRows = (g) => allRows.value.filter(r => r.id >= g.min && r.id <= g.max)

// Per-group sort state
const sorts = ref(groups.map(() => ({ col: 'id', dir: 'desc' })))
const { t } = useI18n()
const { cmpVal } = useSortTable({})

function getSortVal(row, col) {
  if (col === 'id') return row.id
  if (col === 'start_at') return row.start_at
  if (col === 'end_at') return row.end_at
  if (col === 'name') return row.name || ''
  if (col === 'revival_start_at') return row.revival_start_at
  return row.id
}

const sortedCache = reactive({})

function sorted(g, gi) {
  const s = sorts.value[gi]
  const key = `${g.label}-${gi}-${s.col}-${s.dir}`
  if (key in sortedCache) return sortedCache[key]
  const list = [...getGroupRows(g)]
  const dir = s.dir === 'desc' ? -1 : 1
  list.sort((a, b) => {
    const r = cmpVal(getSortVal(a, s.col), getSortVal(b, s.col), dir)
    if (r !== 0) return r
    return (a.id - b.id) * dir
  })
  sortedCache[key] = list
  return list
}

watch(sorts, () => Object.keys(sortedCache).forEach(k => delete sortedCache[k]), { deep: true })

function onSort(gi, col) {
  sorts.value = sorts.value.map((s, i) => {
    if (i !== gi) return s
    if (s.col === col) return { col: s.col, dir: s.dir === 'desc' ? 'asc' : 'desc' }
    return { col, dir: 'asc' }
  })
}

onMounted(async () => {
  let data = await preFetch.events
  if (!data) {
    const resp = await fetch('data/events.json')
    data = await resp.json()
  }
  allRows.value = data
  loading.value = false
})
</script>

<template>
  <div class="event-wrap">
    <div v-if="loading" class="loading">{{ t('loading') }}</div>
    <div v-else-if="isEmpty" class="loading">{{ t('none') }}</div>
    <template v-else>
    <div v-for="(g, gi) in groups" :key="g.label">
      <h3 class="group-title">{{ g.label }}</h3>
      <SortableTable
        :columns="columns"
        :rows="sorted(g, gi)"
        rowKey="id"
        :frozen="0"
        :sortCol="sorts[gi].col"
        :sortDir="sorts[gi].dir"
        @sort="(col) => onSort(gi, col)"
      >
        <template #cell-id="{ row }">{{ row.id }}</template>
        <template #cell-start_at="{ row }">{{ fmtDate(row.start_at) }}</template>
        <template #cell-end_at="{ row }">{{ fmtDate(row.end_at) }}</template>
        <template #cell-name="{ row }">{{ row.name }}</template>
        <template #cell-revival_start_at="{ row }">{{ fmtDate(row.revival_start_at) }}</template>
      </SortableTable>
    </div>
    </template>
  </div>
</template>

<style scoped>
.event-wrap { padding: 16px; }
.group-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 16px 0 8px; padding-left: 8px; border-left: 3px solid var(--accent); }
.event-wrap :deep(.st-wrap) { height: auto; width: max-content; max-width: 100%; margin-left: 0; margin-right: auto; }
.event-wrap :deep(.st-table) { width: auto; }
.event-wrap :deep(.st-table th) { white-space: nowrap; }
.event-wrap :deep(.st-table td) { height: auto; white-space: nowrap; }
</style>
