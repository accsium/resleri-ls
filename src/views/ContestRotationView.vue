<script setup>
import { ref, computed, onMounted } from 'vue'
import SortableTable from '../components/SortableTable.vue'
import { useSortTable } from '../composables/useSortTable'

const columns = [
  { key: 'id', label: 'ID', width: 72 },
  { key: 'start_at', label: '开始日期', width: 140 },
  { key: 'episode_name', label: '名称', minWidth: 300 },
]

const rows = ref([])
const loading = ref(true)
const error = ref('')
const isEmpty = computed(() => !loading.value && !error.value && rows.value.length === 0)
const { sortCol, sortDir, onSort, sortItems } = useSortTable({
  defaultCol: 'start_at',
  defaultDir: 'desc',
})

function getSortVal(row, field) {
  if (field === 'id') return row.id
  if (field === 'start_at') return row.start_at
  return row.episode_name || ''
}

const sorted = computed(() => sortItems(rows.value, getSortVal))

onMounted(async () => {
  try {
    const resp = await fetch('data/contest_rotations.json')
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    rows.value = await resp.json()
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="contest-wrap">
    <div v-if="loading" class="loading">{{ '加载中...' }}</div>
    <div v-else-if="error" class="load-error">{{ error }}</div>
    <div v-else-if="isEmpty" class="empty">暂无数据</div>
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
