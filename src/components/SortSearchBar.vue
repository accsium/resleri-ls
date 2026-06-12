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
  setSortField(cat.fields[0].field)
}
</script>

<template>
  <div class="sf-wrapper">
    <div class="sort-filter-bar ss-bar">
    <!-- 排序 + 搜索 -->
    <div class="sf-row">
      <div class="sort-control">
        <div class="sort-control-head">
          <label class="sf-label" for="sort-category">排序</label>
          <select id="sort-category" name="sort_category" :value="sortCategory" @change="onCategoryChange">
            <option v-for="cat in SORT_CATEGORIES" :key="cat.key" :value="cat.key">
              {{ currentLang === 'cn' ? cat.label_cn : cat.label_ja }}
            </option>
          </select>
        </div>
        <div class="sort-control-tail">
          <label class="sf-label" for="sort-field">排序字段</label>
          <select id="sort-field" name="sort_field" :value="sortField" @change="(e) => setSortField(e.target.value)">
            <option v-for="f in activeCategory.fields" :key="f.field" :value="f.field">
              {{ currentLang === 'cn' ? f.label_cn : f.label_ja }}
            </option>
          </select>
          <button class="sf-order-btn" @click="toggleOrder()">
            {{ currentSortOrder === 'desc' ? '↓ 降序' : '↑ 升序' }}
          </button>
        </div>
      </div>
      <div class="sf-spacer"></div>
      <div class="sf-group">
        <label class="sf-label" for="search-input">搜索</label>
        <input id="search-input" type="text" name="search" v-model="searchText" :placeholder="t('searchPlaceholder')">
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.ss-bar {
  padding: 0 16px;
}
.ss-bar input[type="text"] {
  width: 160px;
  font-size: 12px;
  padding: 3px 8px;
}
</style>
