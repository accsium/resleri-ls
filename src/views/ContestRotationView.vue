<script setup>
import { ref, computed, onMounted } from 'vue'
import SortableTable from '../components/SortableTable.vue'
import { useI18n } from '../composables/useI18n'
import { fmtDate } from '../utils/date.js'
import { preFetch } from '../router'

const { t } = useI18n()

const columns = computed(() => [
  { key: 'id', label: t('id'), width: 72 },
  { key: 'start_at', label: t('startDate'), width: 140 },
  { key: 'episode_name', label: t('episodeName'), minWidth: 300 },
])

const rows = ref([])
const loading = ref(true)
const isEmpty = computed(() => !loading.value && rows.value.length === 0)

onMounted(async () => {
  let data = await preFetch.contestRotations
  if (!data) {
    const resp = await fetch('data/contest_rotations.json')
    data = await resp.json()
  }
  rows.value = data
  loading.value = false
})
</script>

<template>
  <div class="contest-wrap">
    <div v-if="loading" class="loading">{{ t('loading') }}</div>
    <div v-else-if="isEmpty" class="loading">{{ t('none') }}</div>
  <SortableTable v-else
    :columns="columns"
    :rows="rows"
    rowKey="id"
    :frozen="0"
    defaultSortCol="start_at"
    defaultSortDir="desc"
  >
    <template #cell-id="{ row }">{{ row.id }}</template>
    <template #cell-start_at="{ row }">{{ fmtDate(row.start_at) }}</template>
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
