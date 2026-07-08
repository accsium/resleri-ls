<script setup>
import { useI18n } from '../composables/useI18n'
import { useFilters } from '../composables/useFilters'

const { t, currentLang, SORT_FIELDS } = useI18n()
const {
  sortField, currentSortOrder,
  searchText,
  setSortField,
  toggleOrder,
} = useFilters()
</script>

<template>
  <div class="sf-wrapper">
    <div class="sort-filter-bar ss-bar">
    <!-- 排序 + 搜索 -->
    <div class="sf-row">
      <div class="sort-control">
        <label class="sf-label" for="sort-field">排序</label>
        <select id="sort-field" name="sort_field" :value="sortField" @change="(e) => setSortField(e.target.value)">
          <option v-for="f in SORT_FIELDS" :key="f.field" :value="f.field">
            {{ currentLang === 'cn' ? f.label_cn : f.label_ja }}
          </option>
        </select>
        <button class="sf-order-btn" @click="toggleOrder()">
          {{ currentSortOrder === 'desc' ? '↓ 降序' : '↑ 升序' }}
        </button>
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
  padding: var(--inp-padding);
}
</style>
