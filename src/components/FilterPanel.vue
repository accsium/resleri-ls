<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useFilters } from '../composables/useFilters'

const emit = defineEmits(['close'])

const { currentLang, t } = useI18n()
const { activeFilters, setFilters, clearFilters } = useFilters()

const ATTRIBUTE_MAP = { 1: '斬', 2: '打', 3: '突', 5: '火', 6: '氷', 7: '雷', 8: '風' }
const ATTRIBUTE_MAP_CN = { 1: '斩', 2: '打', 3: '突', 5: '火', 6: '冰', 7: '雷', 8: '风' }
const ROLE_MAP = { 1: '攻', 2: '破', 3: '防', 4: '輔' }
const ROLE_MAP_CN = { 1: '攻', 2: '破', 3: '防', 4: '辅' }

const selectedAttrs = ref([...activeFilters.value.attack_attributes])
const selectedRoles = ref([...activeFilters.value.role])

function apply() {
  setFilters({
    attack_attributes: selectedAttrs.value,
    role: selectedRoles.value
  })
  emit('close')
}

function clear() {
  selectedAttrs.value = []
  selectedRoles.value = []
  clearFilters()
  emit('close')
}
</script>

<template>
  <div class="filter-panel">
    <div class="filter-group">
      <span>属性：</span>
      <label v-for="(name, id) in (currentLang === 'cn' ? ATTRIBUTE_MAP_CN : ATTRIBUTE_MAP)" :key="id">
        <input type="checkbox" :value="Number(id)" v-model="selectedAttrs">
        {{ name }}
      </label>
    </div>
    <div class="filter-group">
      <span>职业：</span>
      <label v-for="(name, id) in (currentLang === 'cn' ? ROLE_MAP_CN : ROLE_MAP)" :key="id">
        <input type="checkbox" :value="Number(id)" v-model="selectedRoles">
        {{ name }}
      </label>
    </div>
    <button @click="apply">{{ t('applyFilter') }}</button>
    <button @click="clear">{{ t('clearFilter') }}</button>
  </div>
</template>
