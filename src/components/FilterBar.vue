<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useFilters } from '../composables/useFilters'
import { useCharacterData } from '../composables/useCharacterData'
import StarsDisplay from './StarsDisplay.vue'
import IconDisplay from './IconDisplay.vue'

const { t, currentLang, getTraitColorHex, getField, ATTR_IDS, ROLE_IDS } = useI18n()
const {
  activeFilters,
  toggleFilter, resetFilters,
} = useFilters()

const { battleTraits, equipTraits, loadTraits, attrMap: attrData, roleMap: roleData } = useCharacterData()

function clearAll() {
  resetFilters()
}

const panelLang = ref('ja')
const collapsed = ref(true)
const panelEl = ref(null)

// ── 动态卡片偏移量 ──
const GAP = 8
let currentTarget = 0

function updateCardOffset() {
  if (!panelEl.value) return
  const newTarget = panelEl.value.offsetHeight + 2 * GAP
  const delta = newTarget - currentTarget
  currentTarget = newTarget
  if (delta !== 0) {
    const app = document.querySelector('.app-content')
    if (app) app.scrollTop += delta
  }
}

onMounted(() => {
  if (panelEl.value) {
    currentTarget = panelEl.value.offsetHeight + 2 * GAP
  }
  const ro = new ResizeObserver(() => updateCardOffset())
  ro.observe(panelEl.value)
  onUnmounted(() => { ro.disconnect() })
})

// ── 属性 ──
const attrMap = computed(() => {
  const m = {}
  for (const [id, entry] of Object.entries(attrData.value)) {
    m[id] = getField(entry, 'name')
  }
  return m
})
const selectedAttrs = computed({
  get: () => activeFilters.attack_attributes || [],
  set: (v) => toggleFilter('attack_attributes', v),
})

function cycleTriState(key) {
  const cur = activeFilters[key] ?? 0
  toggleFilter(key, cur < 2 ? cur + 1 : 0)
}

function toggleAttr(id) {
  const cur = [...selectedAttrs.value]
  const idx = cur.indexOf(id)
  if (idx >= 0) cur.splice(idx, 1)
  else cur.push(id)
  selectedAttrs.value = cur
}

// ── 职业 ──
const roleMap = computed(() => {
  const m = {}
  for (const [id, entry] of Object.entries(roleData.value)) {
    m[id] = getField(entry, 'name')
  }
  return m
})
const selectedRoles = computed({
  get: () => activeFilters.role || [],
  set: (v) => toggleFilter('role', v),
})

function toggleRole(id) {
  const cur = [...selectedRoles.value]
  const idx = cur.indexOf(id)
  if (idx >= 0) cur.splice(idx, 1)
  else cur.push(id)
  selectedRoles.value = cur
}

// ── 初始星级 ──
const RARITIES = [1, 2, 3]
const selectedRarities = computed({
  get: () => activeFilters.initial_rarity || [],
  set: (v) => toggleFilter('initial_rarity', v),
})

function toggleRarity(r) {
  const cur = [...selectedRarities.value]
  const idx = cur.indexOf(r)
  if (idx >= 0) cur.splice(idx, 1)
  else cur.push(r)
  selectedRarities.value = cur
}

// ── 调和色 ──
const TRAIT_IDS = [1, 2, 3, 4, 5]

const selectedTraitLeft = computed({
  get: () => activeFilters.trait_color || [],
  set: (v) => toggleFilter('trait_color', v),
})

function toggleTraitLeft(id) {
  const cur = [...selectedTraitLeft.value]
  const idx = cur.indexOf(id)
  if (idx >= 0) cur.splice(idx, 1)
  else cur.push(id)
  selectedTraitLeft.value = cur
}

const selectedTraitRight = computed({
  get: () => activeFilters.support_color || [],
  set: (v) => toggleFilter('support_color', v),
})

function toggleTraitRight(id) {
  const cur = [...selectedTraitRight.value]
  const idx = cur.indexOf(id)
  if (idx >= 0) cur.splice(idx, 1)
  else cur.push(id)
  selectedTraitRight.value = cur
}

// ── 标签/词条下拉数据 ──
const { characterIndex, originalTitleMap, characterTagMap, seriesMap, voiceActorMap, baseCharacterMap } = useCharacterData()

const battleTraitsJa = ref([])
const battleTraitsCn = ref([])
const equipTraitsJa = ref([])
const equipTraitsCn = ref([])
const charTagsJa = ref([])
const charTagsCn = ref([])
const allBattleTraits = computed(() => panelLang.value === 'cn' ? battleTraitsCn.value : battleTraitsJa.value)
const allEquipTraits = computed(() => panelLang.value === 'cn' ? equipTraitsCn.value : equipTraitsJa.value)
const allCharTags = computed(() => panelLang.value === 'cn' ? charTagsCn.value : charTagsJa.value)
const allTitles = computed(() => {
  const seen = new Set()
  const list = []
  for (const c of characterIndex.value) {
    const id = c.original_title_id
    if (!id || seen.has(id)) continue
    const ot = originalTitleMap.value[id]
    const name = ot ? (panelLang.value === 'cn' ? (ot.name_cn || ot.name_ja) : ot.name_ja) : ''
    if (!name) continue
    seen.add(id)
    list.push({ id, name })
  }
  list.sort((a, b) => a.id - b.id)
  return list
})

const allSeries = computed(() => {
  const seen = new Set()
  const list = []
  for (const c of characterIndex.value) {
    const id = c.series_id
    if (!id || seen.has(id)) continue
    const s = seriesMap.value[id]
    const name = s ? (panelLang.value === 'cn' ? (s.name_cn || s.name_ja) : s.name_ja) : ''
    if (!name) continue
    seen.add(id)
    list.push({ id, name })
  }
  list.sort((a, b) => a.id - b.id)
  return list
})
const allVoiceActors = computed(() => {
  const seen = new Set()
  const list = []
  for (const c of characterIndex.value) {
    const id = c.voice_actor_id
    if (!id || seen.has(id)) continue
    const va = voiceActorMap.value[id]
    const name = va ? va.name : ''
    if (!name) continue
    seen.add(id)
    list.push({ id, name })
  }
  list.sort((a, b) => a.id - b.id)
  return list
})

const allBaseCharacters = computed(() => {
  const seen = new Set()
  const list = []
  for (const c of characterIndex.value) {
    const id = c.base_character_id
    if (!id || seen.has(id)) continue
    const bc = baseCharacterMap.value[id]
    const name = bc ? (panelLang.value === 'cn' ? (bc.name_cn || bc.name_ja) : bc.name_ja) : ''
    if (!name) continue
    seen.add(id)
    list.push({ id, name })
  }
  list.sort((a, b) => a.id - b.id)
  return list
})

function groupTraits(list, getName) {
  const cats = {}
  list.forEach(t => {
    const cid = t.category_id || 0
    if (!cats[cid]) cats[cid] = []
    cats[cid].push({ id: t.id, name: getName(t) })
  })
  const result = []
  for (const cid of Object.keys(cats).sort((a, b) => a - b)) {
    cats[cid].sort((a, b) => a.id - b.id)
    result.push({ category: cid, items: cats[cid] })
  }
  return result
}

const traitsLoaded = ref(false)

async function loadTraitData() {
  if (traitsLoaded.value) return
  try {
    await loadTraits()
    const [bt, et] = [battleTraits.value, equipTraits.value]
    battleTraitsJa.value = groupTraits(bt, t => t.name)
    battleTraitsCn.value = groupTraits(bt, t => t.name_cn || t.name)
    equipTraitsJa.value = groupTraits(et, t => t.name)
    equipTraitsCn.value = groupTraits(et, t => t.name_cn || t.name)
    // 标签从 characterTagMap 获取（已由 useCharacterData 加载）
    const tagEntries = Object.values(characterTagMap.value)
    charTagsJa.value = []
    charTagsCn.value = []
    tagEntries.sort((a, b) => (a.priority || 0) - (b.priority || 0)).forEach(t => {
      charTagsJa.value.push({ id: t.id, name: t.name })
      charTagsCn.value.push({ id: t.id, name: t.name_cn || t.name })
    })
    traitsLoaded.value = true
  } catch (e) {
    if (e.name === 'AbortError') return
  }
}

// 首次展开筛选面板时加载词条/标签数据（延迟加载）
watch(collapsed, (now) => {
  if (!now) loadTraitData()
})

// 选中的标签/词条
const selectedBattleTraits = computed({
  get: () => activeFilters.battle_tool_traits || [],
  set: (v) => toggleFilter('battle_tool_traits', v),
})
const selectedEquipTraits = computed({
  get: () => activeFilters.equipment_tool_traits || [],
  set: (v) => toggleFilter('equipment_tool_traits', v),
})
const selectedTags = computed({
  get: () => activeFilters.tags || [],
  set: (v) => toggleFilter('tags', v),
})
const permStatus = computed({
  get: () => activeFilters.permanent_status || [],
  set: (v) => toggleFilter('permanent_status', v),
})
function togglePermStatus(s) {
  const cur = [...permStatus.value]
  const idx = cur.indexOf(s)
  if (idx >= 0) cur.splice(idx, 1); else cur.push(s)
  permStatus.value = cur
}
const atelierFes = computed({
  get: () => activeFilters.atelier_fes || [],
  set: (v) => toggleFilter('atelier_fes', v),
})
function toggleAtelierFes(s) {
  const cur = [...atelierFes.value]
  const idx = cur.indexOf(s)
  if (idx >= 0) cur.splice(idx, 1); else cur.push(s)
  atelierFes.value = cur
}

/** 解析下拉选择器的 ID 值，空字符串返回 '' 避免 Number('')=0 的陷阱 */
function _parseSelectId(val) {
  return val !== '' ? Number(val) : ''
}

const mechanismLabels = computed(() => ({
  has_evo: t('specialEvo'),
  has_range: t('specialRange'),
  has_transform: t('specialTransform'),
  has_active: t('skillType').active,
  has_ex: t('skillType').ex,
}))

const permStatusLabels = computed(() => ({
  permanent: t('permanentTrue'),
  not_permanent: t('permanentFalse'),
  limited: t('permanentLimited'),
}))
</script>

<template>
  <div class="sf-wrapper">
    <div ref="panelEl" class="sort-filter-bar filter-panel" :class="{ 'sf-collapsed': collapsed }">
    <!-- 行1：初始星级 + 职业/属性图标 -->
    <div class="sf-row">
      <div class="sf-field">
        <span class="sf-label">{{ t('initialRarity') }}</span>
        <div class="sf-field-items">
        <label v-for="r in RARITIES" :key="'rar'+r" class="sf-check">
          <input type="checkbox" :name="'rarity-'+r" :checked="selectedRarities.includes(r)" @change="toggleRarity(r)">
          <StarsDisplay :mode="1" :rarity="r" :max-rarity="8" :scale="0.25" />
        </label>
        </div>
      </div>
      <div class="sf-divider"></div>
      <div class="sf-group sf-icons">
        <span class="sf-label">{{ t('role') }}</span>
        <button
          v-for="id in ROLE_IDS" :key="'r'+id"
          class="sf-icon-btn"
          :class="{ active: selectedRoles.includes(id) }"
          @click="toggleRole(id)"
        >
          <IconDisplay type="role" :id="id" :scale="0" :size="0" :alt="roleMap[id]" />
        </button>
      </div>
      <div class="sf-divider"></div>
      <div class="sf-group sf-icons">
        <span class="sf-label">{{ t('attribute') }}</span>
        <button
          v-for="id in ATTR_IDS" :key="'a'+id"
          class="sf-icon-btn"
          :class="{ active: selectedAttrs.includes(id) }"
          @click="toggleAttr(id)"
        >
          <IconDisplay type="attribute" :id="id" :scale="0" :size="0" :alt="attrMap[id]" />
        </button>
      </div>
      <div class="sf-spacer"></div>
      <div class="sf-right-group">
        <button class="sf-ghost-btn sf-collapse-btn" @click="clearAll">{{ t('clearFilter') }}</button>
      </div>
    </div>
    <!-- 行2：调和颜色 + 特殊机制 -->
    <div class="sf-row" v-show="!collapsed">
      <div class="sf-group sf-icons">
        <span class="sf-label">{{ t('traitColor') }}</span>
        <button
          v-for="id in TRAIT_IDS" :key="'tl'+id"
          class="sf-trait-btn"
          :class="{ active: selectedTraitLeft.includes(id) }"
          @click="toggleTraitLeft(id)"
        >
          <svg width="12" height="24" viewBox="0 0 8 16">
            <polygon points="8,0 8,16 0,8" :fill="getTraitColorHex(id)" />
          </svg>
        </button>
        <button
          v-for="id in TRAIT_IDS" :key="'tr'+id"
          class="sf-trait-btn"
          :class="{ active: selectedTraitRight.includes(id) }"
          @click="toggleTraitRight(id)"
        >
          <svg width="12" height="24" viewBox="8 0 8 16">
            <polygon points="8,0 8,16 16,8" :fill="getTraitColorHex(id)" />
          </svg>
        </button>
      </div>
      <div class="sf-divider"></div>
      <div class="sf-field">
        <span class="sf-label">{{ t('specialMechanism') }}</span>
        <div class="sf-field-items">
        <button
          v-for="(label, key) in mechanismLabels"
          :key="key"
          class="sf-ghost-btn sf-tri-btn"
          :class="{ active: activeFilters[key] === 1, exclude: activeFilters[key] === 2 }"
          @click="cycleTriState(key)"
        >
          {{ label }}{{ activeFilters[key] === 1 ? ' ✓' : activeFilters[key] === 2 ? ' ✕' : '' }}
        </button>
        </div>
      </div>
    </div>

    <!-- 行5：恒常化状态 + ATELIER FES -->
    <div class="sf-row" v-show="!collapsed">
      <div class="sf-field">
        <span class="sf-label">{{ t('permanentStatus') }}</span>
        <div class="sf-field-items">
          <label v-for="s in ['permanent','not_permanent','limited']" :key="s" class="sf-check">
            <input type="checkbox" :checked="permStatus.includes(s)" @change="togglePermStatus(s)">{{ permStatusLabels[s] }}
          </label>
        </div>
      </div>
      <div class="sf-divider"></div>
      <div class="sf-field">
        <span class="sf-label">ATELIER FES</span>
        <div class="sf-field-items">
          <label v-for="s in ['fes_0','fes_1','fes_2']" :key="s" class="sf-check">
            <input type="checkbox" :checked="atelierFes.includes(s)" @change="toggleAtelierFes(s)">{{ { fes_0: '初始', fes_1: 'I', fes_2: 'II' }[s] }}
          </label>
        </div>
      </div>
    </div>
    <!-- 行3：道具词条 + 装备词条 -->
    <div class="sf-row" v-show="!collapsed">
      <div class="sf-field">
        <span class="sf-label">{{ t('itemTrait') }}</span>
        <div class="sf-field-items">
        <select :name="'battle_trait-'+n" v-for="n in 2" :key="'bt'+n" class="sf-select"
          :value="selectedBattleTraits[n-1] || ''"
          @change="(e) => { const v = [...selectedBattleTraits]; v[n-1] = _parseSelectId(e.target.value); selectedBattleTraits = v }"
        >
          <option value="">—</option>
          <template v-for="(cat, ci) in allBattleTraits" :key="'btc'+cat.category">
            <option v-if="ci > 0" disabled>──────────</option>
            <option v-for="t in cat.items" :key="t.id" :value="t.id">{{ t.name }}</option>
          </template>
        </select>
        </div>
      </div>
      <div class="sf-divider"></div>
      <div class="sf-field">
        <span class="sf-label">{{ t('equipmentTrait') }}</span>
        <div class="sf-field-items">
        <select name="equip_trait" class="sf-select"
          :value="selectedEquipTraits[0] || ''"
          @change="(e) => { selectedEquipTraits = [_parseSelectId(e.target.value)] }"
        >
          <option value="">—</option>
          <template v-for="(cat, ci) in allEquipTraits" :key="'etc'+cat.category">
            <option v-if="ci > 0" disabled>──────────</option>
            <option v-for="t in cat.items" :key="t.id" :value="t.id">{{ t.name }}</option>
          </template>
        </select>
        </div>
      </div>
    </div>

    <!-- 行4：标签 -->
    <div class="sf-row" v-show="!collapsed">
      <div class="sf-field tag-field">
        <span class="sf-label">{{ t('tags') }}</span>
        <div class="sf-field-items">
        <select :name="'char_tag-'+n" v-for="n in 5" :key="'ct'+n" class="sf-select"
          :value="selectedTags[n-1] || ''"
          @change="(e) => { const v = [...selectedTags]; v[n-1] = _parseSelectId(e.target.value); selectedTags = v }"
        >
          <option value="">—</option>
          <option v-for="t in allCharTags" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        </div>
      </div>
    </div>

    <!-- 行6：角色名 + 声优 + 系列 -->
    <div class="sf-row" v-show="!collapsed">
      <div class="sf-field">
        <span class="sf-label">{{ t('characterName') }}</span>
        <select class="sf-select" :value="activeFilters.base_character" @change="(e) => toggleFilter('base_character', _parseSelectId(e.target.value))">
          <option value="">{{ t('allOption') }}</option>
          <option v-for="bc in allBaseCharacters" :key="bc.id" :value="bc.id">{{ bc.name }}</option>
        </select>
      </div>
      <div class="sf-divider"></div>
      <div class="sf-field">
        <span class="sf-label">{{ t('voiceActorLabel') }}</span>
        <select class="sf-select" :value="activeFilters.voice_actor" @change="(e) => toggleFilter('voice_actor', _parseSelectId(e.target.value))">
          <option value="">{{ t('allOption') }}</option>
          <option v-for="va in allVoiceActors" :key="va.id" :value="va.id">{{ va.name }}</option>
        </select>
      </div>
      <div class="sf-divider"></div>
      <div class="sf-field">
        <span class="sf-label">{{ t('seriesLabel') }}</span>
        <select class="sf-select" :value="activeFilters.series" @change="(e) => toggleFilter('series', _parseSelectId(e.target.value))">
          <option value="">{{ t('allOption') }}</option>
          <option v-for="s in allSeries" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
    </div>

    <!-- 行7：作品出处 -->
    <div class="sf-row" v-show="!collapsed">
      <div class="sf-field">
        <span class="sf-label">{{ t('originalTitleLabel') }}</span>
        <div class="sf-field-items">
          <select class="sf-select" :value="activeFilters.original_title" @change="(e) => toggleFilter('original_title', _parseSelectId(e.target.value))">
            <option value="">{{ t('allOption') }}</option>
            <option v-for="t in allTitles" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
      </div>
      <div class="sf-right-group">
        <div class="sf-group">
          <span class="sf-label">{{ t('traitLang') }}</span>
          <select name="panel_lang" class="sf-select" v-model="panelLang">
            <option value="ja">{{ t('langJA') }}</option>
            <option value="cn">{{ t('langCN') }}</option>
          </select>
        </div>
      </div>
    </div>



    <div class="sf-toggle-bar" @click="collapsed = !collapsed">
      <span class="sf-toggle-arrow">{{ collapsed ? '▼' : '▲' }}</span>
    </div>
    </div>
  </div>
</template>

