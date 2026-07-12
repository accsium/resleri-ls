<script setup>
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import { useCardState } from '../composables/useCardState'
import { fmtDate } from '../utils/date.js'
import AvatarDisplay from './AvatarDisplay.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import CardDetail from './CardDetail.vue'
import StarsDisplay from './StarsDisplay.vue'

let cardUid = 0
const headerObservers = new Map()

const props = defineProps({
  indexEntry: Object,
})

const kid = ++cardUid + '-' + props.indexEntry.id

const { t, currentLang, ATTR_MAP, ATTR_MAP_CN, ROLE_MAP, ROLE_MAP_CN } = useI18n()
const { getCharacterById, baseCharacterMap, traitColorMap, originalTitleMap, characterTagMap, skillsMap, seriesMap, voiceActorMap, battleTraits, equipTraits } = useCharacterData()
const { getCardState, setCardState } = useCardState()

const expanded = ref(false)
const detailLoading = ref(false)
const detailError = ref('')

const baseName = computed(() => {
  const bc = baseCharacterMap.value[props.indexEntry.base_character_id]
  if (!bc) return ''
  return currentLang.value === 'cn' ? (bc.name_cn || bc.name_ja) : bc.name_ja
})
const alias = computed(() => props.indexEntry.another_name || '')
const roleName = computed(() => {
  const map = currentLang.value === 'cn' ? ROLE_MAP_CN : ROLE_MAP
  return map[props.indexEntry.role] || ''
})
const tags = computed(() => {
  return (props.indexEntry.tag_ids || []).map(id => {
    const tag = characterTagMap.value[id]
    if (!tag) return ''
    return currentLang.value === 'cn' ? (tag.name_cn || tag.name) : tag.name
  }).filter(Boolean)
})

const releaseDate = computed(() => fmtDate(props.indexEntry.start_at))

const permanentLabel = computed(() => {
  const s = props.indexEntry.permanent_status
  if (s === 'limited') return t('permanentStatus')
  if (s && s.startsWith('fes_')) return t('permanentStatus')
  if (s === 'permanent') return t('permanentTime')
  if (s === 'not_permanent') return t('permanentTime')
  return ''
})
const permanentText = computed(() => {
  const s = props.indexEntry.permanent_status
  if (s === 'limited') return '非恒常角色'
  if (s === 'fes_0') return '初始'
  if (s === 'fes_1') return 'ATELIER FES I'
  if (s === 'fes_2') return 'ATELIER FES II'
  if (s === 'permanent' || s === 'not_permanent') {
    const d = props.indexEntry.permanent_date
    return d ? fmtDate(d) : ''
  }
  return ''
})
const isNotPermanent = computed(() => props.indexEntry.permanent_status === 'not_permanent')
const isLimited = computed(() => props.indexEntry.permanent_status === 'limited')
const attrsText = computed(() => {
  const attrMap = currentLang.value === 'cn' ? ATTR_MAP_CN : ATTR_MAP
  const names = (props.indexEntry.attack_attributes || []).map(id => attrMap[id] || id)
  return names.join(' / ') + ' | ' + roleName.value
})

function pickSkillIds(char, type, useAlt) {
  if (useAlt && char.switch_stat?.skills?.hasOwnProperty(type)) {
    return char.switch_stat.skills[type]
  }
  return char.skills?.[type] || []
}

function getCharWT(useAlt) {
  const entry = props.indexEntry
  const ids = pickSkillIds(entry, 'normal2', useAlt)
  if (ids.length > 0) {
    const skill = skillsMap.value[ids[ids.length - 1]]
    if (skill) return skill.wt
  }
  return null
}

const initialWT = computed(() => {
  const entry = props.indexEntry
  const speed = entry.initial_status?.speed
  if (!speed || speed <= 0) return '—'
  const cardState = getCardState(props.indexEntry.id)
  const alt = cardState.toggleActive
  const useAlt = hasTransform.value ? !alt : alt
  const ids = pickSkillIds(entry, 'normal2', useAlt)
  const wt = ids.length > 0 ? skillsMap.value[ids[ids.length - 1]]?.wt : null
  if (wt == null) return '—'
  return Math.floor(57600 / speed) + (wt - 200)
})
const status = computed(() => props.indexEntry.initial_status || {})

const statOrder = ['initialWT', 'hp', 'speed', 'attack', 'defense', 'magic', 'mental']
const statCards = computed(() => statOrder.map(key => {
  const label = key === 'initialWT' ? t('initialWTLabel') : t('statLabels')[key]
  const value = key === 'initialWT' ? initialWT.value : (status.value[key] ?? '?')
  return { label, value }
}))

const seriesName = computed(() => {
  const s = seriesMap.value[props.indexEntry.series_id]
  if (!s) return ''
  return currentLang.value === 'cn' ? (s.name_cn || s.name_ja) : s.name_ja
})
const voiceActorName = computed(() => {
  const va = voiceActorMap.value[props.indexEntry.voice_actor_id]
  return va ? va.name : ''
})

const originalTitle = computed(() => {
  const ot = originalTitleMap.value[props.indexEntry.original_title_id]
  if (!ot) return ''
  return currentLang.value === 'cn' ? (ot.name_cn || ot.name_ja) : ot.name_ja
})

const traits = computed(() => {
  const btNames = (props.indexEntry.battle_tool_trait_ids || []).map(id => {
    const t = battleTraits.value.find(t2 => t2.id === id)
    return t ? (currentLang.value === 'cn' ? (t.name_cn || t.name) : t.name) : ''
  }).filter(Boolean)
  const etNames = (props.indexEntry.equipment_tool_trait_ids || []).map(id => {
    const t = equipTraits.value.find(t2 => t2.id === id)
    return t ? (currentLang.value === 'cn' ? (t.name_cn || t.name) : t.name) : ''
  }).filter(Boolean)
  return [...btNames, ...etNames]
})

const cardState = computed(() => getCardState(props.indexEntry.id))

const char = computed(() => getCharacterById(props.indexEntry.id))
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

async function toggleExpand() {
  if (expanded.value) {
    const header = document.querySelector(`.card[data-id="${props.indexEntry.id}"] .card-header`)
    const top = header?.getBoundingClientRect().top
    expanded.value = false
    const observer = headerObservers.get(props.indexEntry.id)
    if (observer) { observer.disconnect(); headerObservers.delete(props.indexEntry.id) }
    if (header && top != null) {
      await nextTick()
      const app = document.querySelector('.app-content')
      const delta = header.getBoundingClientRect().top - top
      if (app) app.scrollTop += delta
    }
    return
  }
  expanded.value = true
  detailLoading.value = false
  detailError.value = ''
  await nextTick()
  const card = document.querySelector(`.card[data-id="${props.indexEntry.id}"]`)
  const header = card?.querySelector('.card-header')
  if (card && header && !headerObservers.has(props.indexEntry.id)) {
    const update = () => card.style.setProperty('--card-head-h', (header.offsetHeight - 1) + 'px')
    update()
    const observer = new ResizeObserver(update)
    observer.observe(header)
    headerObservers.set(props.indexEntry.id, observer)
  }
}

onUnmounted(() => {
  const observer = headerObservers.get(props.indexEntry.id)
  if (observer) { observer.disconnect(); headerObservers.delete(props.indexEntry.id) }
})
</script>

<template>
  <div class="card" :data-id="indexEntry.id">
    <div class="card-header">
      <div class="card-top">
        <span class="card-top-left">
          <span class="card-attrs">{{ attrsText }}</span>
          <span class="card-name">
            {{ baseName }}<span v-if="alias" class="alias">{{ alias }}</span>
          </span>
        </span>
        <div v-if="toggleEnabled" class="switch-buttons">
          <span v-if="toggleLabel" class="toggle-label">{{ toggleLabel }}</span>
          <ToggleSwitch :model-value="cardState.toggleActive" :disabled="!toggleEnabled" @update:model-value="onToggle" :title="toggleLabel" :type="hasEvo ? 'evo' : hasRange ? 'range' : 'transform'" />
        </div>
      </div>

      <div class="card-body">
        <div class="card-body-col-left desk-only">
          <div class="cb-avatar">
            <AvatarDisplay :index-entry="indexEntry" :size="7" :kid="kid" />
          </div>
          <div class="cb-traits">
            <span v-for="trait in traits" :key="trait" class="trait-tag">{{ trait }}</span>
          </div>
        </div>

        <div class="card-body-col-mid desk-only">
          <div class="cb-info">
            <span class="cb-attrs">{{ attrsText }}</span>
            <div class="cb-info-row">
              <div class="cb-info-left">
                <div class="char-id">ID:{{ indexEntry.id }}</div>
                <div class="release-date">{{ t('joinDate') }}: {{ releaseDate }}</div>
                <div v-if="indexEntry.gacha_end_at" class="release-date">{{ t('gachaEnd') }}: {{ fmtDate(indexEntry.gacha_end_at) }}</div>
                <div v-if="permanentText" class="release-date"><template v-if="permanentLabel">{{ permanentLabel }}: </template><span :class="{ 'perm-not': isNotPermanent, 'perm-limited': isLimited }">{{ permanentText }}</span></div>
              </div>
              <div class="cb-info-right">
                <div v-if="indexEntry.fullname" class="cb-fullname">全名: {{ indexEntry.fullname }}</div>
                <div v-if="indexEntry.overlay_name" class="cb-overlay-name">fullname: {{ indexEntry.overlay_name }}</div>
                <div v-if="originalTitle" class="cb-overlay-name">作品出处: {{ originalTitle }}</div>
                <div v-if="seriesName" class="cb-overlay-name">系列: {{ seriesName }}</div>
                <div v-if="voiceActorName" class="cb-overlay-name">声优: {{ voiceActorName }}</div>
              </div>
            </div>
          </div>
          <div class="cb-rarity">
            <span class="max-rarity-label">{{ t('maxRarityLabel') }}</span>
            <StarsDisplay :mode="1" :rarity="indexEntry.max_rarity" :max-rarity="indexEntry.max_rarity" :scale="0.35" />
          </div>
          <div class="cb-tags">
            <span class="cb-tags-label">标签：</span>
            <span class="cb-tags-items"><span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span></span>
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

        <div class="mob-only row-info-avatar">
          <div class="cb-info-mob">
            <span class="cb-attrs">{{ attrsText }}</span>
            <div class="char-id">ID:{{ indexEntry.id }}</div>
            <div class="release-date">{{ t('joinDate') }}: {{ releaseDate }}</div>
            <div v-if="indexEntry.gacha_end_at" class="release-date">{{ t('gachaEnd') }}: {{ fmtDate(indexEntry.gacha_end_at) }}</div>
            <div v-if="permanentText" class="release-date"><template v-if="permanentLabel">{{ permanentLabel }}: </template><span :class="{ 'perm-not': isNotPermanent, 'perm-limited': isLimited }">{{ permanentText }}</span></div>
          </div>
          <div class="cb-avatar-mob">
            <AvatarDisplay :index-entry="indexEntry" :size="7" :kid="kid" />
          </div>
          <div class="cb-traits-mob">
            <span v-for="trait in traits" :key="trait" class="trait-tag">{{ trait }}</span>
          </div>
        </div>

        <div class="mob-only row-rarity-expand">
          <div class="mob-rarity-tags">
            <div class="cb-rarity">
              <span class="max-rarity-label">{{ t('maxRarityLabel') }}</span>
              <StarsDisplay :mode="1" :rarity="indexEntry.max_rarity" :max-rarity="indexEntry.max_rarity" :scale="0.35" />
            </div>
            <div class="cb-tags">
              <span class="cb-tags-label">标签：</span>
              <span class="cb-tags-items"><span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span></span>
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
          <div v-if="seriesName" class="cb-overlay-name">系列: {{ seriesName }}</div>
          <div v-if="voiceActorName" class="cb-overlay-name">声优: {{ voiceActorName }}</div>
        </div>
        <CardDetail :character-data="char" :card-state="cardState" :character-id="indexEntry.id" />
      </template>
    </div>
  </div>
</template>
