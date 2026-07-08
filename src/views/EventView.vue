<script setup>
import { ref, computed, onMounted } from 'vue'
import SortableTable from '../components/SortableTable.vue'
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

const { t } = useI18n()

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
        :rows="getGroupRows(g)"
        rowKey="id"
        :frozen="0"
        defaultSortCol="id"
        defaultSortDir="desc"
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
