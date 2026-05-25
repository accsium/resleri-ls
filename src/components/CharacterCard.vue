<script setup>
import { ref, computed, onUnmounted, nextTick, watch } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import { useCardState } from '../composables/useCardState'
import AvatarDisplay from './AvatarDisplay.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import CardDetail from './CardDetail.vue'

const props = defineProps({
  indexEntry: Object,
})

const { t, getField } = useI18n()
const { loadCharacter, loadedCharacters } = useCharacterData()
const { getCardState, setCardState } = useCardState()

const expanded = ref(false)
const detailLoading = ref(false)
const detailError = ref('')

const starCountMap = { 1: 1, 2: 2, 3: 3, 5: 4, 7: 5, 8: 6 }
const maxStarScale = 0.5

const baseName = computed(() => getField(props.indexEntry, 'base_character_name') || (props.indexEntry.name_cn || props.indexEntry.name_ja))
const alias = computed(() => props.indexEntry.another_name || '')
const roleName = computed(() => getField(props.indexEntry, 'role_name'))
const tags = computed(() => (getField(props.indexEntry, 'tag_names') || []).slice(0, 3))
const releaseDate = computed(() => {
  if (!props.indexEntry.start_at) return '—'
  return new Date(props.indexEntry.start_at).toLocaleDateString('ja-JP')
})
const attrsText = computed(() => (getField(props.indexEntry, 'attack_attribute_names') || []).join(' / ') + ' | ' + roleName.value)
const initialWT = computed(() => props.indexEntry.initial_wt ?? '—')
const status = computed(() => props.indexEntry.initial_status || {})

const statOrder = ['initialWT', 'hp', 'speed', 'attack', 'defense', 'magic', 'mental']
const statCards = computed(() => statOrder.map(key => {
  const label = key === 'initialWT' ? t('initialWTLabel') : t('statLabels')[key]
  const value = key === 'initialWT' ? initialWT.value : (status.value[key] ?? '?')
  return { label, value }
}))

const traits = computed(() => [
  ...(getField(props.indexEntry, 'battle_tool_trait_names') || []),
  ...(getField(props.indexEntry, 'equipment_tool_trait_names') || [])
])

const maxStars = computed(() => starCountMap[props.indexEntry.max_rarity] || 0)

const cardState = computed(() => getCardState(props.indexEntry.id))

const char = computed(() => loadedCharacters.value[props.indexEntry.id])
const hasEvo = computed(() => (char.value?._skills || []).some(s => s.post_evolution.length > 0))
const hasRange = computed(() => Object.keys(char.value?._rangeSkills || {}).length > 0)
const hasTransform = computed(() => char.value?._transform != null)

let scrollHandler = null

function onEvoToggle(val) {
  setCardState(props.indexEntry.id, { evo: val ? 'pre' : 'post' })
}
function onRangeToggle(val) {
  setCardState(props.indexEntry.id, { range: val ? 'normal' : 'inrange' })
}
function onTransformToggle(val) {
  setCardState(props.indexEntry.id, { showTransform: val })
}

async function toggleExpand() {
  if (expanded.value) {
    expanded.value = false
    removeScrollHandler()
    return
  }
  expanded.value = true
  detailLoading.value = true
  detailError.value = ''
  try {
    await loadCharacter(props.indexEntry.id)
    detailLoading.value = false
    await nextTick()
    setupScrollHandler()
  } catch (e) {
    detailLoading.value = false
    detailError.value = e.message || String(e)
  }
}

function setupScrollHandler() {
  removeScrollHandler()
  scrollHandler = () => {
    const el = document.querySelector(`.card[data-id="${props.indexEntry.id}"]`)
    if (!el || !expanded.value) return
    const header = el.querySelector('.card-header')
    const detailDiv = el.querySelector('.card-detail')
    if (!header || !detailDiv) return
    const stickyTop = 144
    const rect = header.getBoundingClientRect()
    if (rect.top <= stickyTop) {
      detailDiv.style.maxHeight = `${window.innerHeight - stickyTop - header.offsetHeight}px`
      detailDiv.style.overflowY = 'auto'
      header.style.position = 'sticky'
      header.style.top = stickyTop + 'px'
      header.style.zIndex = '5'
      header.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
    } else {
      detailDiv.style.maxHeight = ''
      detailDiv.style.overflowY = ''
      header.style.position = ''
      header.style.top = ''
      header.style.zIndex = ''
      header.style.boxShadow = ''
    }
  }
  window.addEventListener('scroll', scrollHandler, { passive: true })
  scrollHandler()
}

function removeScrollHandler() {
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
    scrollHandler = null
  }
}

onUnmounted(removeScrollHandler)
</script>

<template>
  <div class="card" :data-id="indexEntry.id" :class="{ 'card-sticky': expanded }">
    <div class="card-header">
      <div class="card-p1">
        <div class="p1-left">
          <span class="p1-attrs">{{ attrsText }}</span>
          <span class="p1-title">
            {{ baseName }}<span v-if="alias" class="alias">{{ alias }}</span>
          </span>
        </div>
        <div class="switch-buttons">
          <ToggleSwitch v-if="hasEvo" :model-value="cardState.evo === 'pre'" @update:model-value="onEvoToggle" title="切换进化状态" type="evo" />
          <ToggleSwitch v-if="hasRange" :model-value="cardState.range === 'normal'" @update:model-value="onRangeToggle" title="切换范围状态" type="range" />
          <ToggleSwitch v-if="hasTransform" :model-value="cardState.showTransform" @update:model-value="onTransformToggle" title="切换变身状态" type="transform" />
        </div>
      </div>
      <div class="card-p2">
        <div class="p2-col p2-col1">
          <div class="avatar-col">
            <AvatarDisplay :index-entry="indexEntry" :size="100" />
          </div>
          <div class="inline-traits">
            <span v-for="(trait, i) in traits" :key="i" class="trait-tag">{{ trait }}</span>
          </div>
        </div>
        <div class="p2-col p2-col2">
          <div class="char-id">ID:{{ indexEntry.id }}</div>
          <div v-if="maxStars > 0" class="max-rarity-row">
            <span class="max-rarity-label">{{ t('maxRarityLabel') }}</span>
            <span class="stars-group">
              <img
                v-for="i in maxStars" :key="i"
                :src="'image/misc/' + (indexEntry.max_rarity === 8 ? 'star_2' : 'star_1') + '.png'"
                :style="{
                  width: Math.round(67 * maxStarScale) + 'px',
                  height: Math.round(64 * maxStarScale) + 'px',
                  marginLeft: i === 1 ? '0' : Math.round(-20 * maxStarScale) + 'px'
                }"
              >
            </span>
          </div>
          <div class="tags">
            <span v-for="(tag, i) in tags" :key="i" class="tag">{{ tag }}</span>
          </div>
          <div class="release-date">{{ t('joinDate') }}: {{ releaseDate }}</div>
          <div class="stats-row">
            <div v-for="stat in statCards" :key="stat.label" class="stat-card">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">{{ stat.value }}</div>
            </div>
          </div>
        </div>
        <div class="p2-col p2-col3">
          <button class="expand-btn" @click="toggleExpand" aria-label="展开">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#5b6e82" stroke-width="2" fill="none"/>
              <path
                :d="expanded ? 'M9 14 L12 11 L15 14' : 'M9 10 L12 13 L15 10'"
                stroke="#5b6e82" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="card-detail" :class="{ open: expanded }">
      <div v-if="detailLoading" class="loading">{{ t('loading') }}</div>
      <div v-else-if="detailError" class="no-data">{{ t('loadFailed') }}: {{ detailError }}</div>
      <CardDetail v-else-if="char" :character-data="char" :card-state="cardState" :character-id="indexEntry.id" />
    </div>
  </div>
</template>
