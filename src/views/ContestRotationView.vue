<script setup>
import { ref, computed, onMounted } from 'vue'
import SortableTable from '../components/SortableTable.vue'

const columns = [
  { key: 'id', label: 'ID', width: 72 },
  { key: 'start_at', label: '开始日期', width: 140 },
  { key: 'episode_name', label: '名称', minWidth: 300 },
]

const rows = ref([])
const sortCol = ref('start_at')
const sortDir = ref('desc')

const sorted = computed(() => {
  const list = [...rows.value]
  const dir = sortDir.value === 'desc' ? -1 : 1
  list.sort((a, b) => {
    let va, vb
    if (sortCol.value === 'id') { va = a.id; vb = b.id }
    else if (sortCol.value === 'start_at') { va = a.start_at; vb = b.start_at }
    else { va = a.episode_name || ''; vb = b.episode_name || '' }
    if (typeof va === 'string') { const c = va.localeCompare(vb); if (c) return c * dir }
    else { if (va < vb) return -1 * dir; if (va > vb) return 1 * dir }
    return (a.id - b.id) * dir
  })
  return list
})

function onSort(col) {
  if (sortCol.value === col) sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  else { sortCol.value = col; sortDir.value = 'asc' }
}

onMounted(async () => {
  const resp = await fetch('data/contest_rotations.json')
  rows.value = await resp.json()
})
</script>

<template>
  <div class="contest-wrap">
  <SortableTable
    :columns="columns"
    :rows="sorted"
    rowKey="id"
    :frozen="0"
    :sortCol="sortCol"
    :sortDir="sortDir"
    @sort="onSort"
  >
    <template #cell-id="{ row }">{{ row.id }}</template>
    <template #cell-start_at="{ row }">{{ row.start_at }}</template>
    <template #cell-episode_name="{ row }">{{ row.episode_name }}</template>
  </SortableTable>
  </div>
</template>

<style scoped>
.contest-wrap { display: flex; justify-content: center; }
.contest-wrap :deep(.st-wrap) { height: auto; width: auto; }
.contest-wrap :deep(.st-table) { width: auto; }
.contest-wrap :deep(.st-table td) { height: auto; }
</style>
