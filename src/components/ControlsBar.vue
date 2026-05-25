<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useFilters } from '../composables/useFilters'

const emit = defineEmits(['toggleFilter'])

const { currentLang, SORT_FIELDS } = useI18n()
const { activeSortFields, currentSortOrder, setSortField, toggleOrder } = useFilters()

function handleSortChange(e) {
  setSortField(e.target.value)
}

const orderLabel = computed(() => currentSortOrder.value === 'desc' ? '↓' : '↑')
</script>

<template>
  <div class="controls-bar">
    <div class="sort-control">
      <label>排序：</label>
      <select
        :value="activeSortFields[0]?.field || ''"
        @change="handleSortChange"
      >
        <option
          v-for="sf in SORT_FIELDS"
          :key="sf.field"
          :value="sf.field"
        >
          {{ currentLang === 'cn' ? sf.label_cn : sf.label_ja }}
        </option>
      </select>
      <button
        class="order-btn"
        :class="{ desc: currentSortOrder === 'desc' }"
        @click="toggleOrder()"
      >{{ orderLabel }}</button>
    </div>
    <button class="filter-btn" @click="emit('toggleFilter')">筛选</button>
  </div>
</template>
