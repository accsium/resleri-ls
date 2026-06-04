<script setup>
import { ref, computed, onMounted } from 'vue'
import SortableTable from '../components/SortableTable.vue'

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

const getGroupRows = (g) => computed(() => allRows.value.filter(r => r.id >= g.min && r.id <= g.max))

// Per-group sort state
const sorts = ref(groups.map(() => ({ col: 'id', dir: 'desc' })))

function sorted(g, gi) {
  const s = sorts.value[gi]
  const list = [...getGroupRows(g).value]
  const dir = s.dir === 'desc' ? -1 : 1
  list.sort((a, b) => {
    let va, vb
    if (s.col === 'id') { va = a.id; vb = b.id }
    else if (s.col === 'start_at'){ va = a.start_at; vb = b.start_at }
    else if (s.col === 'end_at') { va = a.end_at; vb = b.end_at }
    else if (s.col === 'name') { va = a.name || ''; vb = b.name || '' }
    else if (s.col === 'revival_start_at') { va = a.revival_start_at; vb = b.revival_start_at }
    else { va = a.id; vb = b.id }
    if (typeof va === 'string') { const c = va.localeCompare(vb); if (c) return c * dir }
    else { if (va < vb) return -1 * dir; if (va > vb) return 1 * dir }
    return (a.id - b.id) * dir
  })
  return list
}

function onSort(gi, col) {
  const s = sorts.value[gi]
  if (s.col === col) s.dir = s.dir === 'desc' ? 'asc' : 'desc'
  else { s.col = col; s.dir = 'asc' }
}

onMounted(async () => {
  const resp = await fetch('data/events.json')
  allRows.value = await resp.json()
})
</script>

<template>
  <div class="contest-wrap">
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
        <template #cell-start_at="{ row }">{{ row.start_at }}</template>
        <template #cell-end_at="{ row }">{{ row.end_at }}</template>
        <template #cell-name="{ row }">{{ row.name }}</template>
        <template #cell-revival_start_at="{ row }">{{ row.revival_start_at }}</template>
      </SortableTable>
    </div>
  </div>
</template>

<style scoped>
.contest-wrap { padding: 16px; }
.group-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 16px 0 8px; padding-left: 8px; border-left: 3px solid var(--accent); }
.contest-wrap :deep(.st-wrap) { height: auto; width: auto; }
.contest-wrap :deep(.st-wrap) { height: auto; width: max-content; max-width: 100%; margin-left: 0; margin-right: auto; }
.contest-wrap :deep(.st-table) { width: auto; }
.contest-wrap :deep(.st-table th) { white-space: nowrap; }
.contest-wrap :deep(.st-table td) { height: auto; white-space: nowrap; }
</style>
