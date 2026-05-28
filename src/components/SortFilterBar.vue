<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useFilters } from '../composables/useFilters'
import StarsDisplay from './StarsDisplay.vue'
import IconDisplay from './IconDisplay.vue'

const { t, currentLang, SORT_CATEGORIES, SKILL_TYPE_OPTS, SKILL_STAT_OPTS, TRAIT_COLOR_HEX, ATTR_MAP, ATTR_MAP_CN, ROLE_MAP, ROLE_MAP_CN } = useI18n()
const {
  sortCategory, sortField, sortSkillType, sortSkillStat, currentSortOrder,
  activeFilters, searchText,
  setSortCategory, setSortField, setSortSkillType, setSortSkillStat,
  toggleOrder, toggleFilter,
} = useFilters()

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
  document.documentElement.style.setProperty('--card-offset', newTarget + 'px')
  if (delta !== 0) {
    window.scrollBy({ top: delta, behavior: 'instant' })
  }
}

onMounted(() => {
  if (panelEl.value) {
    currentTarget = panelEl.value.offsetHeight + 2 * GAP
    document.documentElement.style.setProperty('--card-offset', currentTarget + 'px')
  }
  const ro = new ResizeObserver(() => updateCardOffset())
  ro.observe(panelEl.value)
  onUnmounted(() => ro.disconnect())
})

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

// ── 属性 (attack_attribute 按 id 顺序: 1=斩 2=打 3=突 5=火 6=冰 7=雷 8=风) ──
const ATTR_IDS = [1, 2, 3, 5, 6, 7, 8]
const attrMap = computed(() => currentLang.value === 'cn' ? ATTR_MAP_CN : ATTR_MAP)
const selectedAttrs = computed({
  get: () => activeFilters.value.attack_attributes || [],
  set: (v) => toggleFilter('attack_attributes', v),
})

function toggleAttr(id) {
  const cur = [...selectedAttrs.value]
  const idx = cur.indexOf(id)
  if (idx >= 0) cur.splice(idx, 1)
  else cur.push(id)
  selectedAttrs.value = cur
}

// ── 职业 (按 id 顺序: 1=攻 2=破 3=防 4=輔) ──
const ROLE_IDS = [1, 2, 3, 4]
const roleMap = computed(() => currentLang.value === 'cn' ? ROLE_MAP_CN : ROLE_MAP)
const selectedRoles = computed({
  get: () => activeFilters.value.role || [],
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
  get: () => activeFilters.value.initial_rarity || [],
  set: (v) => toggleFilter('initial_rarity', v),
})

function toggleRarity(r) {
  const cur = [...selectedRarities.value]
  const idx = cur.indexOf(r)
  if (idx >= 0) cur.splice(idx, 1)
  else cur.push(r)
  selectedRarities.value = cur
}

// ── 调和色 (按 trait_color_id 排序: 1=青 2=紫 3=黄 4=赤 5=緑) ──
const TRAIT_IDS = [1, 2, 3, 4, 5]
function traitColorHex(id) { return TRAIT_COLOR_HEX[id] || '#ccc' }

const selectedTraitLeft = computed({
  get: () => activeFilters.value.trait_color || [],
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
  get: () => activeFilters.value.support_color || [],
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
// Uses character_index data provided by useCharacterData prop injection
import { useCharacterData } from '../composables/useCharacterData'
const { characterIndex } = useCharacterData()

// 双语标签数据
const tagsJa = ref([])
const tagsCn = ref([])
const allTags = computed(() => panelLang.value === 'cn' ? tagsCn.value : tagsJa.value)

// 双语词条数据
const battleTraitsJa = ref([])
const battleTraitsCn = ref([])
const equipTraitsJa = ref([])
const equipTraitsCn = ref([])
const allBattleTraits = computed(() => panelLang.value === 'cn' ? battleTraitsCn.value : battleTraitsJa.value)
const allEquipTraits = computed(() => panelLang.value === 'cn' ? equipTraitsCn.value : equipTraitsJa.value)

function groupTraits(list, getName) {
  const cats = {}
  list.forEach(t => {
    const cid = t.category_id || 0
    if (!cats[cid]) cats[cid] = []
    cats[cid].push({ id: t.id, name: getName(t) })
  })
  const result = []
  for (const cid of Object.keys(cats).sort((a, b) => a - b)) {
    result.push({ category: cid, items: cats[cid] })
  }
  return result
}

onMounted(async () => {
  // 标签：从 character_index 分别收集 ja/cn
  const tj = new Set()
  const tc = new Set()
  for (const c of characterIndex.value) {
    const ja = c.tag_names_ja
    const cn = c.tag_names_cn
    if (Array.isArray(ja)) ja.forEach(t => tj.add(t))
    if (Array.isArray(cn)) cn.forEach(t => tc.add(t))
  }
  tagsJa.value = [...tj].sort()
  tagsCn.value = [...tc].sort()

  // 词条数据
  try {
    const [bttJ, bttC, ettJ, ettC] = await Promise.all([
      fetch('data/jp/battle_tool_trait.json').then(r => r.json()),
      fetch('data/cn/battle_tool_trait.json').then(r => r.json()).catch(() => []),
      fetch('data/jp/equipment_tool_trait.json').then(r => r.json()),
      fetch('data/cn/equipment_tool_trait.json').then(r => r.json()).catch(() => []),
    ])
    battleTraitsJa.value = groupTraits(bttJ, t => t.name)
    battleTraitsCn.value = groupTraits(bttC.length ? bttC : bttJ, t => t.name_cn || t.name)
    equipTraitsJa.value = groupTraits(ettJ, t => t.name)
    equipTraitsCn.value = groupTraits(ettC.length ? ettC : ettJ, t => t.name_cn || t.name)
  } catch {}
})

// 选中的标签/词条
const selectedTags = computed({
  get: () => activeFilters.value.tags || [],
  set: (v) => toggleFilter('tags', v),
})
const selectedBattleTraits = computed({
  get: () => activeFilters.value.battle_tool_traits || [],
  set: (v) => toggleFilter('battle_tool_traits', v),
})
const selectedEquipTraits = computed({
  get: () => activeFilters.value.equipment_tool_traits || [],
  set: (v) => toggleFilter('equipment_tool_traits', v),
})
</script>

<template>
  <div class="sf-wrapper">
    <div ref="panelEl" class="sort-filter-bar">
    <!-- 行1：初始星级 + 职业/属性图标 + 展开 -->
    <div class="sf-row">
      <div class="sf-field">
        <span class="sf-label">初始星级</span>
        <div class="sf-field-items">
        <label v-for="r in RARITIES" :key="'rar'+r" class="sf-check">
          <input type="checkbox" :checked="selectedRarities.includes(r)" @change="toggleRarity(r)">
          <StarsDisplay :mode="1" :rarity="r" :max-rarity="8" :scale="0.25" />
        </label>
        </div>
      </div>
      <div class="sf-divider"></div>
      <div class="sf-group sf-icons">
        <button
          v-for="id in ROLE_IDS" :key="'r'+id"
          class="sf-icon-btn"
          :class="{ active: selectedRoles.includes(id) }"
          @click="toggleRole(id)"
        >
          <IconDisplay type="role" :id="id" :size="24" :alt="roleMap[id]" />
        </button>
      </div>
      <div class="sf-divider"></div>
      <div class="sf-group sf-icons">
        <button
          v-for="id in ATTR_IDS" :key="'a'+id"
          class="sf-icon-btn"
          :class="{ active: selectedAttrs.includes(id) }"
          @click="toggleAttr(id)"
        >
          <IconDisplay type="attribute" :id="id" :size="24" :alt="attrMap[id]" />
        </button>
      </div>
      <div class="sf-spacer"></div>
      <div class="sf-right-group">
        <button class="sf-collapse-btn" @click="collapsed = !collapsed">
          {{ collapsed ? '展开 ▼' : '收起 ▲' }}
        </button>
      </div>
    </div>
    <!-- 行2：调和颜色 + 词条语言 -->
    <div class="sf-row" v-show="!collapsed">
      <div class="sf-group sf-icons">
        <span class="sf-label">调和颜色</span>
        <button
          v-for="id in TRAIT_IDS" :key="'tl'+id"
          class="sf-trait-btn"
          :class="{ active: selectedTraitLeft.includes(id) }"
          @click="toggleTraitLeft(id)"
        >
          <svg width="12" height="24" viewBox="0 0 8 16">
            <polygon points="8,0 8,16 0,8" :fill="traitColorHex(id)"
              :opacity="selectedTraitLeft.includes(id) ? 1 : 0.3" />
          </svg>
        </button>
        <button
          v-for="id in TRAIT_IDS" :key="'tr'+id"
          class="sf-trait-btn"
          :class="{ active: selectedTraitRight.includes(id) }"
          @click="toggleTraitRight(id)"
        >
          <svg width="12" height="24" viewBox="8 0 8 16">
            <polygon points="8,0 8,16 16,8" :fill="traitColorHex(id)"
              :opacity="selectedTraitRight.includes(id) ? 1 : 0.3" />
          </svg>
        </button>
      </div>
      <div class="sf-right-group">
        <div class="sf-group">
          <span class="sf-label">词条语言</span>
          <select class="sf-select" v-model="panelLang">
            <option value="ja">日本語</option>
            <option value="cn">中文</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 行3：道具词条 + 装备词条 -->
    <div class="sf-row" v-show="!collapsed">
      <div class="sf-field">
        <span class="sf-label">道具词条</span>
        <div class="sf-field-items">
        <select v-for="n in 2" :key="'bt'+n" class="sf-select"
          :value="selectedBattleTraits[n-1] || ''"
          @change="(e) => { const v = [...selectedBattleTraits]; v[n-1] = Number(e.target.value) || ''; selectedBattleTraits = v }"
        >
          <option value="">—</option>
          <template v-for="(cat, ci) in allBattleTraits" :key="'btc'+cat.category">
            <option v-if="ci > 0" disabled>──────────</option>
            <option v-for="t in cat.items" :key="t.id" :value="t.id">{{ t.name }}</option>
          </template>
        </select>
        </div>
      </div>
      <div class="sf-field">
        <span class="sf-label">装备词条</span>
        <div class="sf-field-items">
        <select class="sf-select"
          :value="selectedEquipTraits[0] || ''"
          @change="(e) => { selectedEquipTraits = [Number(e.target.value) || ''] }"
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
      <div class="sf-field">
        <span class="sf-label">标签</span>
        <div class="sf-field-items">
      <select v-for="n in 5" :key="'tag'+n" class="sf-select"
        :value="selectedTags[n-1] || ''"
        @change="(e) => { const v = [...selectedTags]; v[n-1] = e.target.value; selectedTags = v }"
      >
        <option value="">—</option>
        <option v-for="t in allTags" :key="t" :value="t">{{ t }}</option>
      </select>
        </div>
      </div>
    </div>

    <!-- 行5：特殊机制 -->
    <div class="sf-row" v-show="!collapsed">
      <div class="sf-field">
        <span class="sf-label">特殊机制</span>
        <div class="sf-field-items">
        <button
          v-for="(label, key) in { has_evo: '进化', has_range: '范围变化', has_transform: '变身', has_active: '发动技能', has_ex: 'EX技能' }"
          :key="key"
          class="sf-tri-btn"
          :class="{ active: activeFilters[key] === 1, exclude: activeFilters[key] === 2 }"
          @click="toggleFilter(key, (activeFilters[key] || 0) < 2 ? (activeFilters[key] || 0) + 1 : 0)"
        >
          {{ label }}{{ activeFilters[key] === 1 ? ' ✓' : activeFilters[key] === 2 ? ' ✕' : '' }}
        </button>
        </div>
      </div>
      <div class="sf-divider"></div>
      <div class="sf-field">
        <span class="sf-label">恒常化</span>
        <div class="sf-field-items">
          <select class="sf-select" :value="activeFilters.permanent_status" @change="(e) => toggleFilter('permanent_status', e.target.value)">
            <option value="">全部</option>
            <option value="已恒常化">已恒常化</option>
            <option value="ATELIER FES I">ATELIER FES I</option>
            <option value="ATELIER FES II">ATELIER FES II</option>
            <option value="未恒常化">未恒常化</option>
            <option value="非恒常角色">非恒常角色</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 行6：排序 + 搜索 -->
    <div class="sf-row">
      <div class="sort-control">
        <div class="sort-control-head">
          <span class="sf-label">排序</span>
          <select :value="sortCategory" @change="onCategoryChange">
            <option v-for="cat in SORT_CATEGORIES" :key="cat.key" :value="cat.key">
              {{ currentLang === 'cn' ? cat.label_cn : cat.label_ja }}
            </option>
          </select>
        </div>
        <div class="sort-control-tail">
          <template v-if="sortCategory !== 'skill'">
            <select v-model="sortField" @change="(e) => setSortField(e.target.value)">
              <option v-for="f in activeCategory.fields" :key="f.field" :value="f.field">
                {{ currentLang === 'cn' ? f.label_cn : f.label_ja }}
              </option>
            </select>
          </template>
          <template v-else>
            <select class="sf-skill-sel" v-model="sortSkillType" @change="(e) => setSortSkillType(e.target.value)">
              <option v-for="st in SKILL_TYPE_OPTS" :key="st.key" :value="st.key">
                {{ currentLang === 'cn' ? st.label_cn : st.label_ja }}
              </option>
            </select>
            <select class="sf-skill-sel" v-model="sortSkillStat" @change="(e) => setSortSkillStat(e.target.value)">
              <option v-for="ss in SKILL_STAT_OPTS" :key="ss.key" :value="ss.key">
                {{ currentLang === 'cn' ? ss.label_cn : ss.label_ja }}
              </option>
            </select>
          </template>
          <button class="sf-order-btn" @click="toggleOrder()">
            {{ currentSortOrder === 'desc' ? '↓ 降序' : '↑ 升序' }}
          </button>
        </div>
      </div>
      <div class="sf-right-group">
        <div class="sf-group">
          <span class="sf-label">搜索</span>
          <input type="text" v-model="searchText" :placeholder="t('searchPlaceholder')">
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

