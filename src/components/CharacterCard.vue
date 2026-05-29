<script setup>
import { ref, computed, nextTick } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import { useCardState } from '../composables/useCardState'
import AvatarDisplay from './AvatarDisplay.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import CardDetail from './CardDetail.vue'
import StarsDisplay from './StarsDisplay.vue'

const props = defineProps({
  indexEntry: Object,
})

const { t, getField, currentLang, ATTR_MAP, ATTR_MAP_CN, ROLE_MAP, ROLE_MAP_CN } = useI18n()
const { loadCharacter, loadedCharacters } = useCharacterData()
const { getCardState, setCardState } = useCardState()

const expanded = ref(false)
const detailLoading = ref(false)
const detailError = ref('')

const baseName = computed(() => getField(props.indexEntry, 'base_character_name') || (props.indexEntry.name_cn || props.indexEntry.name_ja))
const alias = computed(() => props.indexEntry.another_name || '')
const roleName = computed(() => {
  const map = currentLang.value === 'cn' ? ROLE_MAP_CN : ROLE_MAP
  return map[props.indexEntry.role] || ''
})
const tags = computed(() => getField(props.indexEntry, 'tag_names') || [])
const fmtDate = (d) => {
  if (!d) return '—'
  return d.substring(0, 10).replace(/-/g, '/')
}
const releaseDate = computed(() => fmtDate(props.indexEntry.start_at))

const permanentLabel = computed(() => {
  if (!props.indexEntry.permanent_status) return ''
  if (props.indexEntry.permanent_status === '未恒常化') return t('permanentTime')
  return t('permanentDate')
})
const permanentText = computed(() => {
  const s = props.indexEntry.permanent_status
  const d = props.indexEntry.permanent_date
  if (!s) return ''
  if (s === '未恒常化') return d ? fmtDate(d) : '—'
  if (s === '非恒常角色') return '非恒常角色'
  if (d) return d
  return s
})
const attrsText = computed(() => {
  const attrMap = currentLang.value === 'cn' ? ATTR_MAP_CN : ATTR_MAP
  const names = (props.indexEntry.attack_attributes || []).map(id => attrMap[id] || id)
  return names.join(' / ') + ' | ' + roleName.value
})
const initialWT = computed(() => {
  const cardState = getCardState(props.indexEntry.id)
  return cardState.toggleActive ? props.indexEntry.alt_initial_wt ?? '—' : props.indexEntry.base_initial_wt ?? '—'
})
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

async function toggleExpand() {
  if (expanded.value) {
    const card = document.querySelector(`.card[data-id="${props.indexEntry.id}"]`)
    const header = card?.querySelector('.card-header')
    const top = header?.getBoundingClientRect().top
    expanded.value = false
    if (header && top != null) {
      await nextTick()
      window.scrollBy(0, header.getBoundingClientRect().top - top)
    }
    return
  }
  expanded.value = true
  detailLoading.value = true
  detailError.value = ''
  try {
    await loadCharacter(props.indexEntry.id)
    detailLoading.value = false
    await nextTick()
    // ResizeObserver 跟踪 header 高度
    const card = document.querySelector(`.card[data-id="${props.indexEntry.id}"]`)
    const header = card?.querySelector('.card-header')
    if (card && header && !card._headerObserver) {
      const update = () => card.style.setProperty('--card-head-h', (header.offsetHeight - 1) + 'px')
      update()
      card._headerObserver = new ResizeObserver(update)
      card._headerObserver.observe(header)
    }
  } catch (e) {
    detailLoading.value = false
    detailError.value = e.message || String(e)
  }
}

</script>

<template>
  <div class="card" :data-id="indexEntry.id">
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
                <div v-if="indexEntry.gacha_end_at" class="release-date">{{ t('gachaEnd') }}: {{ fmtDate(indexEntry.gacha_end_at) }}</div>
                <div v-if="permanentLabel" class="release-date">{{ permanentLabel }}: {{ permanentText }}</div>
              </div>
              <div class="cb-info-right">
                <div v-if="indexEntry.fullname" class="cb-fullname">全名: {{ indexEntry.fullname }}</div>
                <div v-if="indexEntry.overlay_name" class="cb-overlay-name">fullname: {{ indexEntry.overlay_name }}</div>
                <div v-if="originalTitle" class="cb-overlay-name">作品出处: {{ originalTitle }}</div>
              </div>
            </div>
          </div>
          <div class="cb-rarity">
            <span class="max-rarity-label">{{ t('maxRarityLabel') }}</span>
            <StarsDisplay :mode="1" :rarity="indexEntry.max_rarity" :max-rarity="indexEntry.max_rarity" :scale="0.5" />
          </div>
          <div class="cb-tags">
            <span class="cb-tags-label">标签：</span>
            <span class="cb-tags-items"><span v-for="(tag, i) in tags" :key="i" class="tag">{{ tag }}</span></span>
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
            <div v-if="indexEntry.gacha_end_at" class="release-date">{{ t('gachaEnd') }}: {{ fmtDate(indexEntry.gacha_end_at) }}</div>
            <div v-if="permanentLabel" class="release-date">{{ permanentLabel }}: {{ permanentText }}</div>
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
            <div class="cb-rarity">
              <span class="max-rarity-label">{{ t('maxRarityLabel') }}</span>
              <StarsDisplay :mode="1" :rarity="indexEntry.max_rarity" :max-rarity="indexEntry.max_rarity" :scale="0.5" />
            </div>
            <div class="cb-tags">
              <span class="cb-tags-label">标签：</span>
              <span class="cb-tags-items"><span v-for="(tag, i) in tags" :key="i" class="tag">{{ tag }}</span></span>
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
