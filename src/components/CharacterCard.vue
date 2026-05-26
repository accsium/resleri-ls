<script setup>
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import { useCardState } from '../composables/useCardState'
import AvatarDisplay from './AvatarDisplay.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import CardDetail from './CardDetail.vue'
import StarIcon from './StarIcon.vue'
import StarsDisplay from './StarsDisplay.vue'

const props = defineProps({
  indexEntry: Object,
})

const { t, getField, currentLang } = useI18n()
const { loadCharacter, loadedCharacters } = useCharacterData()
const { getCardState, setCardState } = useCardState()

const expanded = ref(false)
const detailLoading = ref(false)
const detailError = ref('')

const starCountMap = { 1: 1, 2: 2, 3: 3, 5: 4, 7: 5, 8: 6 }

const baseName = computed(() => getField(props.indexEntry, 'base_character_name') || (props.indexEntry.name_cn || props.indexEntry.name_ja))
const alias = computed(() => props.indexEntry.another_name || '')
const roleName = computed(() => getField(props.indexEntry, 'role_name'))
const tags = computed(() => getField(props.indexEntry, 'tag_names') || [])
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

const originalTitle = computed(() => getField(props.indexEntry, 'original_title_name'))
const traits = computed(() => [
  ...(getField(props.indexEntry, 'battle_tool_trait_names') || []),
  ...(getField(props.indexEntry, 'equipment_tool_trait_names') || [])
])

const maxStars = computed(() => starCountMap[props.indexEntry.max_rarity] || 0)
const maxStarType = computed(() => props.indexEntry.max_rarity === 8 ? 'star_3' : 'star_1')

const cardState = computed(() => getCardState(props.indexEntry.id))

const char = computed(() => loadedCharacters.value[props.indexEntry.id])
const hasEvo = computed(() => props.indexEntry.has_evo)
const hasRange = computed(() => props.indexEntry.has_range)
const hasTransform = computed(() => props.indexEntry.has_transform)

const toggleEnabled = computed(() => hasEvo.value || hasRange.value || hasTransform.value)

const state = getCardState(props.indexEntry.id)
if (!('_init' in state)) {
  state._init = true
  if (hasEvo.value || hasTransform.value) {
    state.toggleActive = true
  }
}

const toggleLabel = computed(() => {
  if (hasEvo.value) return currentLang.value === 'cn' ? '进化' : '進化'
  if (hasRange.value) return currentLang.value === 'cn' ? '范围' : '範囲'
  if (hasTransform.value) return currentLang.value === 'cn' ? '变身' : '変身'
  return ''
})


function onToggle(val) {
  setCardState(props.indexEntry.id, { toggleActive: val })
}

let scrollHandler = null
let detailDiv = null
let stickyTop = 0

async function toggleExpand() {
  if (expanded.value) {
    expanded.value = false
    cleanupSticky()
    return
  }
  expanded.value = true
  detailLoading.value = true
  detailError.value = ''
  setupStickyHeader()
  try {
    await loadCharacter(props.indexEntry.id)
    detailLoading.value = false
    await nextTick()
  } catch (e) {
    detailLoading.value = false
    detailError.value = e.message || String(e)
  }
}

function setupStickyHeader() {
  const el = document.querySelector(`.card[data-id="${props.indexEntry.id}"]`)
  if (!el) return
  const header = el.querySelector('.card-header')
  detailDiv = el.querySelector('.card-detail')
  if (!header || !detailDiv) return
  stickyTop = window.innerWidth < 768 ? 104 : 124

  scrollHandler = () => {
    if (!expanded.value) return
    const rect = header.getBoundingClientRect()
    if (rect.top <= stickyTop) {
      detailDiv.style.overflowY = 'auto'
      detailDiv.style.maxHeight = `${window.innerHeight - stickyTop - header.offsetHeight}px`
    } else {
      detailDiv.style.overflowY = ''
      detailDiv.style.maxHeight = ''
    }
  }
  window.addEventListener('scroll', scrollHandler, { passive: true })
  scrollHandler()
}

function cleanupSticky() {
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
    scrollHandler = null
  }
  if (detailDiv) {
    detailDiv.style.maxHeight = ''
  }
}

onUnmounted(cleanupSticky)

</script>

<template>
  <div class="card" :data-id="indexEntry.id" :class="{ 'card-sticky': expanded }">
    <div class="card-header">
      <!-- 第一行：名字 + 切换 -->
      <div class="card-top">
        <span class="card-top-left">
          <span class="card-attrs">{{ attrsText }}</span>
          <span class="card-name">
            {{ baseName }}<span v-if="alias" class="alias">{{ alias }}</span>
          </span>
        </span>
        <div class="switch-buttons">
          <span v-if="toggleLabel" class="toggle-label">{{ toggleLabel }}</span>
          <ToggleSwitch :model-value="cardState.toggleActive" :disabled="!toggleEnabled" @update:model-value="onToggle" :title="toggleLabel" :type="hasEvo ? 'evo' : hasRange ? 'range' : 'transform'" />
        </div>
      </div>

      <!-- 第二行+：网格布局，桌面和移动共用元素，CSS Grid 重排 -->
      <div class="card-body">
        <!-- ====== 桌面：三列 flex ====== -->
        <div class="card-body-col-left desk-only">
          <div class="cb-avatar">
            <AvatarDisplay :index-entry="indexEntry" :size="100" />
          </div>
          <div class="cb-traits">
            <span v-for="(trait, i) in traits" :key="i" class="trait-tag">{{ trait }}</span>
          </div>
        </div>

        <div class="card-body-col-mid desk-only">
          <div class="cb-info">
            <span class="cb-attrs">{{ attrsText }}</span>
            <div class="cb-info-row">
              <div class="cb-info-left">
                <div class="char-id">ID:{{ indexEntry.id }}</div>
                <div class="release-date">{{ t('joinDate') }}: {{ releaseDate }}</div>
              </div>
              <div class="cb-info-right">
                <div v-if="indexEntry.fullname" class="cb-fullname">全名: {{ indexEntry.fullname }}</div>
                <div v-if="indexEntry.overlay_name" class="cb-overlay-name">fullname: {{ indexEntry.overlay_name }}</div>
                <div v-if="originalTitle" class="cb-overlay-name">作品出处: {{ originalTitle }}</div>
              </div>
            </div>
          </div>
          <div v-if="maxStars > 0" class="cb-rarity">
            <span class="max-rarity-label">{{ t('maxRarityLabel') }}</span>
            <div class="stars-row-wrap" :style="{ height: 45 * 0.5 + 'px' }">
              <StarsDisplay :scale="0.5">
                <StarIcon
                  v-for="i in maxStars" :key="i"
                  :src="'image/misc/' + maxStarType + '.png'"
                />
              </StarsDisplay>
            </div>
          </div>
          <div class="cb-tags">
            <span class="cb-tags-label">标签：</span>
            <span v-for="(tag, i) in tags" :key="i" class="tag">{{ tag }}</span>
          </div>
          <div class="cb-stats">
            <div v-for="stat in statCards" :key="stat.label" class="stat-card">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">{{ stat.value }}</div>
            </div>
          </div>
        </div>

        <div class="card-body-col-right desk-only">
          <button class="cb-expand-desk" @click="toggleExpand">
            {{ expanded ? '收起 ▲' : '展开 ▼' }}
          </button>
        </div>

        <!-- ====== 移动：独立行布局 ====== -->
        <div class="mob-only row-info-avatar">
          <div class="cb-info-mob">
            <span class="cb-attrs">{{ attrsText }}</span>
            <div class="char-id">ID:{{ indexEntry.id }}</div>
            <div class="release-date">{{ t('joinDate') }}: {{ releaseDate }}</div>
          </div>
          <div class="cb-avatar-mob">
            <AvatarDisplay :index-entry="indexEntry" :size="100" />
          </div>
          <div class="cb-traits-mob">
            <span v-for="(trait, i) in traits" :key="i" class="trait-tag">{{ trait }}</span>
          </div>
        </div>

        <div class="mob-only row-rarity-expand">
          <div class="mob-rarity-tags">
            <div v-if="maxStars > 0" class="cb-rarity">
              <span class="max-rarity-label">{{ t('maxRarityLabel') }}</span>
              <div class="stars-row-wrap" :style="{ height: 45 * 0.5 + 'px' }">
              <StarsDisplay :scale="0.5">
                <StarIcon
                  v-for="i in maxStars" :key="i"
                  :src="'image/misc/' + maxStarType + '.png'"
                />
              </StarsDisplay>
            </div>
            </div>
            <div class="cb-tags">
              <span class="cb-tags-label">标签：</span>
              <span v-for="(tag, i) in tags" :key="i" class="tag">{{ tag }}</span>
            </div>
          </div>
          <button class="cb-expand-mob" @click="toggleExpand">
            {{ expanded ? '收起 ▲' : '展开 ▼' }}
          </button>
        </div>
      </div>
    </div>

    <div class="card-detail" :class="{ open: expanded }">
      <div v-if="detailLoading" class="loading">{{ t('loading') }}</div>
      <div v-else-if="detailError" class="no-data">{{ t('loadFailed') }}: {{ detailError }}</div>
      <template v-else-if="char">
        <div class="mobile-stats">
          <div class="section-title">基础信息</div>
          <div class="stats-row">
            <div v-for="stat in statCards" :key="stat.label" class="stat-card">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">{{ stat.value }}</div>
            </div>
          </div>
          <div v-if="indexEntry.fullname" class="cb-fullname">全名: {{ indexEntry.fullname }}</div>
          <div v-if="indexEntry.overlay_name" class="cb-overlay-name">fullname: {{ indexEntry.overlay_name }}</div>
          <div v-if="originalTitle" class="cb-overlay-name">作品出处: {{ originalTitle }}</div>
        </div>
        <CardDetail :character-data="char" :card-state="cardState" :character-id="indexEntry.id" />
      </template>
    </div>
  </div>
</template>
