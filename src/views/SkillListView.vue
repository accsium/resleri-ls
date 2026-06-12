<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import { useSortTable } from '../composables/useSortTable'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import IconDisplay from '../components/IconDisplay.vue'
import SortableTable from '../components/SortableTable.vue'
import PaginationBar from '../components/PaginationBar.vue'

const { characterIndex } = useCharacterData()
const { t, currentLang, getField, ATTR_MAP, ATTR_MAP_CN, ATTR_IDS } = useI18n()

const attrMap = computed(() => currentLang.value === 'cn' ? ATTR_MAP_CN : ATTR_MAP)
const charIndexMap = computed(() => {
  const m = {}; for (const c of characterIndex.value) m[c.id] = c; return m
})

const columns = [
  { key: 'id', label: 'ID', width: 72 },
  { key: 'avatar', label: '头像', width: 88 },
  { key: 'name', label: '角色名', minWidth: 240 },
  { key: 'type', label: '种类', minWidth: 84, align: 'center' },
  { key: 'state', label: '状态', minWidth: 72, align: 'center' },
  { key: 'target', label: '对象', minWidth: 84, align: 'center' },
  { key: 'attr', label: '属性', width: 56, align: 'center' },
  { key: 'dmg', label: '伤害', width: 64, align: 'center' },
  { key: 'brk', label: '破防', width: 64, align: 'center' },
  { key: 'heal', label: '治疗', width: 64, align: 'center' },
  { key: 'wait', label: 'WT', width: 56, align: 'center' },
  { key: 'limit', label: '限制', width: 56, align: 'center' },
  { key: 'skillName', label: '技能名', minWidth: 240 },
  { key: 'skillDesc', label: '描述', minWidth: 1200 },
]

const skills = ref([])
const loading = ref(true)
const error = ref('')
const { sortCol, sortDir, onSort: onTableSort, sortItems } = useSortTable({
  defaultCol: 'id',
  defaultDir: 'asc',
  avatarAlias: 'id',
})

const TYPE_LABEL = { normal1:'一技能', normal2:'二技能', burst:'爆发技能', active1:'发动技能', ex:'EX技能' }
const TYPE_KEYS = ['normal1','normal2','burst','ex','active1']
const STATE_KEYS = ['进化前','进化後','内圈','外圈','变身前','変身後','—']
const WT_OPTS = [0,75,100,175,200,275,300]
const TARGET_KEYS = ['友方','敌方','单体','全体','其他']
const searchText = ref('')

const activeFilters = reactive({
  attr: [],
  type: [],
  state: [],
  target: [],
  wt: [],
})

function toggleFilter(key, val) {
  const arr = activeFilters[key]
  const i = arr.indexOf(val)
  if (i >= 0) arr.splice(i, 1)
  else arr.push(val)
}

function formatPower(v) {
  if (v == null || v === 0) return '—'
  return v + '%'
}

function targetCat(name) {
  const cats = []
  if (name.includes('敌方')) cats.push('敌方')
  else if (name.includes('友方')) cats.push('友方')
  if (name.includes('单体')) cats.push('单体')
  else if (name.includes('全体')) cats.push('全体')
  if (cats.length === 0) cats.push('其他')
  return cats
}

function getSkillSortVal(row, field) {
  switch (field) {
    case 'avatar': return (charIndexMap.value[row.char_id] || {}).uid || ''
    case 'id': return row.char_id
    case 'name': return getField(row, 'base_name')
    case 'type': return row.type
    case 'state': return row.state
    case 'target': return getField(row, 'target_name')
    case 'attr': { const idx = ATTR_IDS.indexOf(row.attack_attributes?.[0]); return idx === -1 ? 999 : idx }
    case 'dmg': return row.dmg_power ?? -1
    case 'brk': return row.break_power ?? -1
    case 'heal': return row.heal_power ?? -1
    case 'wait': return row.wait != null ? (200 + row.wait) : 9999
    case 'limit': return row.limit_count ?? 0
    case 'skillName': return row.name || ''
    case 'skillDesc': return row.description || ''
    default: return ''
  }
}

const filteredSkills = computed(() => {
  let list = skills.value

  // 筛选
  const fa = activeFilters
  if (fa.attr.length) list = list.filter(r => fa.attr.some(a => r.attack_attributes?.includes(a)))
  if (fa.type.length) list = list.filter(r => fa.type.includes(r.type))
  if (fa.state.length) list = list.filter(r => fa.state.includes(r.state))
  if (fa.target.length) list = list.filter(r => {
    const cats = targetCat(getField(r, 'target_name'))
    return fa.target.every(t => cats.includes(t))
  })
  if (fa.wt.length) list = list.filter(r => r.wait != null && fa.wt.includes(200 + r.wait))

  // 搜索
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    )
  }

  // 排序（在筛选之后，减少排序数据量）
  list = sortItems(list, getSkillSortVal)
  return list
})

// ── 分页 ──
const slPage = ref(1)
const slPageSize = ref(50)
const slTotalPages = computed(() => Math.ceil(filteredSkills.value.length / slPageSize.value) || 1)
const pagedSkills = computed(() => {
  const start = (slPage.value - 1) * slPageSize.value
  return filteredSkills.value.slice(start, start + slPageSize.value)
})

// 筛选/搜索变化回到第一页
watch([() => filteredSkills.value.length, searchText], () => {
  slPage.value = 1
})

function onSort(col) {
  onTableSort(col)
}

onMounted(async () => {
  try {
    const resp = await fetch('data/skills.json')
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    data.forEach((r, i) => r._idx = i)
    skills.value = data
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="loading" class="loading">{{ t('loading') }}</div>
  <div v-else-if="error" class="load-error">{{ error }}</div>
  <template v-else>
  <div class="skf-bar">
    <!-- 属性 -->
    <span class="skf-label">属性</span>
    <button v-for="id in ATTR_IDS" :key="'a'+id"
      class="sf-icon-btn" :class="{ active: activeFilters.attr.includes(id) }"
      :aria-label="'筛选属性：' + attrMap[id]"
      @click="toggleFilter('attr', id)"
    ><IconDisplay type="attribute" :id="id" :size="24" /></button>
    <span class="skf-sep"></span>
    <!-- 种类 -->
    <span class="skf-label">种类</span>
    <label v-for="t in TYPE_KEYS" :key="'t'+t" class="skf-check">
      <input type="checkbox" :checked="activeFilters.type.includes(t)" @change="toggleFilter('type',t)">{{ TYPE_LABEL[t] }}
    </label>
    <span class="skf-sep"></span>
    <!-- 状态 -->
    <span class="skf-label">状态</span>
    <label v-for="s in STATE_KEYS" :key="'s'+s" class="skf-check">
      <input type="checkbox" :checked="activeFilters.state.includes(s)" @change="toggleFilter('state',s)">{{ s === '—' ? '其他' : s }}
    </label>
    <span class="skf-sep"></span>
    <!-- 对象 -->
    <span class="skf-label">对象</span>
    <label v-for="t in TARGET_KEYS" :key="'tg'+t" class="skf-check">
      <input type="checkbox" :checked="activeFilters.target.includes(t)" @change="toggleFilter('target',t)">{{ t }}
    </label>
    <span class="skf-sep"></span>
    <!-- WT -->
    <span class="skf-label">WT</span>
    <label v-for="w in WT_OPTS" :key="'w'+w" class="skf-check">
      <input type="checkbox" :checked="activeFilters.wt.includes(w)" @change="toggleFilter('wt',w)">{{ w }}
    </label>
    <span class="skf-sep"></span>
    <input type="text" v-model="searchText" placeholder="搜索技能名或描述..." class="skf-search">
  </div>
  <!-- 分页（上） -->
  <PaginationBar
    :currentPage="slPage" :pageSize="slPageSize"
    :totalPages="slTotalPages" :totalItems="filteredSkills.length"
    :pageSizes="[30, 50, 100, 300, 500, 1000]"
    @update:currentPage="slPage = $event"
    @update:pageSize="slPageSize = $event"
  />

  <SortableTable
    :columns="columns"
    :rows="pagedSkills"
    rowKey="_idx"
    :frozen="2"
    :sortCol="sortCol"
    :sortDir="sortDir"
    @sort="onSort"
  >
    <template #cell-id="{ row }">{{ row.char_id }}</template>
    <template #cell-avatar="{ row }">
      <div style="text-align:center;line-height:0">
        <AvatarDisplay v-if="charIndexMap[row.char_id]" :indexEntry="charIndexMap[row.char_id]" :size="72" />
      </div>
    </template>
    <template #cell-name="{ row }">
      {{ currentLang === 'cn' ? row.base_name_cn : row.base_name_ja }}<template v-if="row.another_name"> <span style="font-size:11px;color:var(--text-muted)">{{ row.another_name }}</span></template>
    </template>
    <template #cell-type="{ row }">{{ TYPE_LABEL[row.type] || row.type }}</template>
    <template #cell-state="{ row }">{{ row.state }}</template>
    <template #cell-target="{ row }">
      {{ currentLang === 'cn' ? row.target_name_cn : row.target_name_ja }}
    </template>
    <template #cell-attr="{ row }">
      {{ (row.attack_attributes || []).map(a => attrMap[a] || a).join(' ') }}
    </template>
    <template #cell-dmg="{ row }">{{ formatPower(row.dmg_power) }}</template>
    <template #cell-brk="{ row }">{{ formatPower(row.break_power) }}</template>
    <template #cell-heal="{ row }">{{ formatPower(row.heal_power) }}</template>
    <template #cell-wait="{ row }">{{ row.wait != null ? (200 + row.wait) : '—' }}</template>
    <template #cell-limit="{ row }">{{ row.limit_count || '—' }}</template>
    <template #cell-skillName="{ row }">{{ row.name }}</template>
    <template #cell-skillDesc="{ row }"><span v-html="row.description"></span></template>
  </SortableTable>

  <!-- 分页（下） -->
  <PaginationBar
    :currentPage="slPage" :pageSize="slPageSize"
    :totalPages="slTotalPages" :totalItems="filteredSkills.length"
    :pageSizes="[30, 50, 100, 300, 500, 1000]"
    @update:currentPage="slPage = $event"
    @update:pageSize="slPageSize = $event"
  />
</template>
</template>

<style scoped>
.skf-bar {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 8px 16px;
  background: var(--bg-banner); border-radius: var(--radius-lg);
  margin: 8px auto 0; width: 90%; max-width: 840px;
}
.skf-label { font-size: 12px; color: #aaa; white-space: nowrap; }
.skf-sep { width: 1px; height: 20px; background: rgba(255,255,255,0.15); margin: 0 4px; }
.skf-check { display: flex; align-items: center; gap: 2px; cursor: pointer; font-size: 12px; color: #aaa; }
.skf-check input { accent-color: var(--accent); }
.skf-search {
  width: 180px; font-size: 12px; padding: 4px 8px;
  background: rgba(255,255,255,0.08); color: var(--text-light);
  border: 1px solid rgba(255,255,255,0.12); border-radius: var(--radius);
}
.skf-search::placeholder { color: #888; }
.skf-search:focus { border-color: var(--accent); }

.sk-pg-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 0; font-size: 13px;
  width: 90%; max-width: 840px; margin: 0 auto;
}
.sk-pg-bar .pg-btn { width: auto; padding: 2px 8px; }
.sk-pg-bar .pg-btn:disabled { opacity: 0.4; cursor: default; }
.sk-pg-bar .pg-info { color: var(--text-muted); }
.sk-pg-bar .pg-size { color: var(--text-muted); margin-left: auto; }
.sk-pg-bar .pg-size-sel { padding: var(--sel-padding); font-size: 12px; }
.load-error { text-align: center; padding: 30px; color: var(--text-muted); }
:deep(.st-wrap) { height: auto; }
</style>
