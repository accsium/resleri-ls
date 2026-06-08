<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useFilters } from '../composables/useFilters'

const { t, currentLang, SORT_CATEGORIES } = useI18n()
const {
  sortCategory, sortField, currentSortOrder,
  searchText,
  setSortCategory, setSortField,
  toggleOrder,
} = useFilters()

// ── 排序 ──
const activeCategory = computed(() =>
  SORT_CATEGORIES.find(c => c.key === sortCategory.value) || SORT_CATEGORIES[0]
)

function onCategoryChange(e) {
  const cat = SORT_CATEGORIES.find(c => c.key === e.target.value)
  setSortCategory(cat.key)
  if (cat.key !== 'skill') {
    setSortField(cat.fields[0].field)
  }
}
</script>

<template>
  <div class="sf-wrapper">
    <div class="sort-filter-bar ss-bar">
    <!-- 排序 + 搜索 -->
    <div class="sf-row">
      <div class="sort-control">
        <div class="sort-control-head">
          <span class="sf-label">排序</span>
          <select name="sort_category" :value="sortCategory" @change="onCategoryChange">
            <option v-for="cat in SORT_CATEGORIES" :key="cat.key" :value="cat.key">
              {{ currentLang === 'cn' ? cat.label_cn : cat.label_ja }}
            </option>
          </select>
        </div>
        <div class="sort-control-tail">
          <select name="sort_field" v-model="sortField" @change="(e) => setSortField(e.target.value)">
            <option v-for="f in activeCategory.fields" :key="f.field" :value="f.field">
              {{ currentLang === 'cn' ? f.label_cn : f.label_ja }}
            </option>
          </select>
          <button class="sf-order-btn" @click="toggleOrder()">
            {{ currentSortOrder === 'desc' ? '↓ 降序' : '↑ 升序' }}
          </button>
        </div>
      </div>
      <div class="sf-right-group">
        <div class="sf-group">
          <span class="sf-label">搜索</span>
          <input type="text" name="search" v-model="searchText" :placeholder="t('searchPlaceholder')">
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.ss-bar {
  padding: 0 16px;
}
</style>
