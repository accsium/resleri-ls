<script setup>
import { ref, computed, onMounted } from 'vue'
import SortableTable from '../components/SortableTable.vue'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import { fmtDate } from '../utils/date.js'
import { preFetch } from '../router'

const { t } = useI18n()
const { characterIndex, loadIndex } = useCharacterData()

const columns = computed(() => [
  { key: 'id', label: t('id'), width: 72 },
  { key: 'start_at', label: t('startDate'), width: 140 },
  { key: 'end_at', label: t('endDate'), width: 140 },
  { key: 'gacha_image', label: t('gacha'), width: 254 },
  { key: 'characters', label: t('characters'), minWidth: 100 },
  { key: 'picked_up_memoria_ids', label: 'picked_up_memoria_ids', minWidth: 100 },
])

const CATEGORIES = ['LEGEND FES', '有償限定', '衣装調合', '其他']
const activeCategory = ref(CATEGORIES[0])

const allRows = ref([])
const loading = ref(true)
const isEmpty = computed(() => !loading.value && allRows.value.length === 0)

const categoryRows = computed(() => {
  const map = {}
  for (const cat of CATEGORIES) map[cat] = []
  for (const row of allRows.value) {
    if (map[row.category]) map[row.category].push(row)
  }
  return map
})

const displayRows = computed(() => categoryRows.value[activeCategory.value] || [])

const charMap = computed(() => {
  const map = {}
  for (const c of characterIndex.value) map[c.id] = c
  return map
})

onMounted(async () => {
  await loadIndex()
  let data = await preFetch.gachas
  if (!data) {
    const resp = await fetch('data/gachas.json')
    data = await resp.json()
  }
  allRows.value = data
  loading.value = false
})
</script>

<template>
  <div class="gacha-wrap">
    <div v-if="loading" class="loading">{{ t('loading') }}</div>
    <div v-else-if="isEmpty" class="loading">{{ t('none') }}</div>
    <template v-else>
      <div class="gacha-cats">
        <button
          v-for="cat in CATEGORIES"
          :key="cat"
          class="gacha-cat-btn"
          :class="{ active: activeCategory === cat }"
          @click="activeCategory = cat"
        >{{ cat === '其他' ? t('targetFilter').other : cat }}</button>
      </div>
      <SortableTable
        :columns="columns"
        :rows="displayRows"
        rowKey="id"
        :frozen="0"
        defaultSortCol="start_at"
        defaultSortDir="desc"
      >
        <template #cell-id="{ row }">{{ row.id }}</template>
        <template #cell-start_at="{ row }">{{ fmtDate(row.start_at) }}</template>
        <template #cell-end_at="{ row }">{{ fmtDate(row.end_at) }}</template>
        <template #cell-gacha_image="{ row }">
          <img v-if="row.gacha_image" :src="'image/gacha/' + row.gacha_image + '.webp'" style="height: 80px;">
          <span v-else>{{ row.name }}</span>
        </template>
        <template #cell-characters="{ row }">
          <span class="gacha-chars">
            <template v-for="cid in row.character_ids" :key="cid">
              <AvatarDisplay
                v-if="charMap[cid]"
                :indexEntry="charMap[cid]"
                :scale="1" :size="0"
              />
            </template>
          </span>
        </template>
      </SortableTable>
    </template>
  </div>
</template>

<style scoped>
.gacha-chars { display: inline-flex; gap: 4px; }
.gacha-wrap :deep(.st-table td) { height: auto; }
.gacha-cats {
  display: flex; gap: 8px;
  padding: 16px 16px 8px;
  justify-content: center;
}
.gacha-cat-btn {
  font-size: 12px;
  padding: 6px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--overlay-white-08);
  color: var(--text-primary);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.gacha-cat-btn:hover { border-color: var(--accent); }
.gacha-cat-btn.active {
  background: var(--accent);
  color: var(--sf-active-text);
  border-color: var(--accent);
}
</style>
