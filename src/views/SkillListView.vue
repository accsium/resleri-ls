<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import { useSortTable } from '../composables/useSortTable'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import IconDisplay from '../components/IconDisplay.vue'
import SortableTable from '../components/SortableTable.vue'
import PaginationBar from '../components/PaginationBar.vue'

const { characterIndex, indexLoaded, skillsMap, baseCharacterMap, loadIndex, loadSkills } = useCharacterData()
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

const STATE_LABEL = {
  evolve: ['进化前', '进化後'],
  range:  ['内圈', '外圈'],
  change: ['変身後', '变身前'],
}

const TYPE_LABEL = { normal1:'一技能', normal2:'二技能', burst:'爆发技能', ex:'EX技能' }
const TYPE_KEYS = ['normal1','normal2','burst','ex']
const STATE_KEYS = ['进化前','进化後','内圈','外圈','变身前','変身後','—']
const WT_OPTS = [0,75,100,175,200,275,300]
const TARGET_KEYS = ['友方','敌方','单体','全体','其他']
const searchText = ref('')

const activeFilters = reactive({
  attr: [], type: [], state: [], target: [], wt: [],
})

function toggleFilter(key, val) {
  const arr = activeFilters[key]
  const i = arr.indexOf(val)
  if (i >= 0) arr.splice(i, 1)
  else arr.push(val)
}

function formatPower(v) { return v != null ? v + '%' : '—' }

function targetCat(name) {
  const cats = []
  if (name.includes('敌方')) cats.push('敌方')
  else if (name.includes('友方')) cats.push('友方')
  if (name.includes('单体')) cats.push('单体')
  else if (name.includes('全体')) cats.push('全体')
  if (cats.length === 0) cats.push('其他')
  return cats
}

// 从 character_index + skillsMap 构建平铺技能行
function buildSkillRows() {
  const rows = []
  for (const char of characterIndex.value) {
    const sk = char.skills || {}
    const sw = char.switch
    const baseState = sw ? (STATE_LABEL[sw]?.[0] || '—') : '—'
    const altState = sw ? (STATE_LABEL[sw]?.[1] || null) : null

    // 基础形态技能
    for (const type of ['normal1', 'normal2', 'burst']) {
      const ids = sk[type]?.pre || []
      if (ids.length > 0) {
        const skill = skillsMap.value[ids[ids.length - 1]]
        if (skill) rows.push(buildRow(char, type, baseState, skill))
      }
    }
    // EX 技能
    const exIds = sk.ex || []
    if (exIds.length > 0) {
      const lastId = exIds[exIds.length - 1]
      const skill = skillsMap.value[lastId]
      if (skill) rows.push(buildRow(char, 'ex', '—', skill))
    }

    // 切换形态技能
    if (altState) {
      if (sw === 'evolve') {
        for (const type of ['normal1', 'normal2', 'burst']) {
          const ids = sk[type]?.post || []
          if (ids.length > 0) {
            const skill = skillsMap.value[ids[ids.length - 1]]
            if (skill) rows.push(buildRow(char, type, altState, skill))
          }
        }
      } else if (sw === 'change' && char.switch_stat?.skills) {
        const stSk = char.switch_stat.skills
        for (const type of ['normal1', 'normal2', 'burst']) {
          const ids = stSk[type]?.pre || []
          if (ids.length > 0) {
            const skill = skillsMap.value[ids[ids.length - 1]]
            if (skill) rows.push(buildRow(char, type, altState, skill))
          }
        }
        const stExIds = stSk.ex || []
        if (stExIds.length > 0) {
          const skill = skillsMap.value[stExIds[stExIds.length - 1]]
          if (skill) rows.push(buildRow(char, 'ex', altState, skill))
        }
      }
    }
  }
  rows.forEach((r, i) => r._idx = i)
  return rows
}

function buildRow(char, type, state, skill) {
  const isHeal = skill.skill_power_type && [5,6,7].includes(skill.skill_power_type)
  const isDmg  = skill.skill_power_type && [1,2,3,4].includes(skill.skill_power_type)
  const bc = baseCharacterMap.value[char.base_character_id]
  return {
    _idx: 0,
    char_id: char.id,
    base_name_ja: bc?.name_ja || '',
    base_name_cn: (bc?.name_cn || bc?.name_ja) || '',
    another_name: char.another_name || '',
    type,
    state,
    skill_target_type: skill.skill_target_type ?? null,
    target_name_ja: skill.target_name_ja || '',
    target_name_cn: skill.target_name_cn || '',
    attack_attributes: skill.attack_attributes || [],
    dmg_power: isDmg ? (skill.power ?? null) : null,
    break_power: skill.break_power ?? null,
    heal_power: isHeal ? (skill.power ?? null) : null,
    wt: skill.wt ?? null,
    limit_count: skill.limit_count || null,
    name: skill.name || '',
    description: skill.description || '',
  }
}

const skillsReady = ref(false)

onMounted(async () => {
  await loadIndex()
  await loadSkills()
  skillsReady.value = true
})

const skills = computed(() => (indexLoaded.value && skillsReady.value) ? buildSkillRows() : [])

function getSkillSortVal(row, field) {
  switch (field) {
    case 'uid':
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
    case 'wait': return row.wt ?? 9999
    case 'limit': return row.limit_count ?? 0
    case 'skillName': return row.name || ''
    case 'skillDesc': return row.description || ''
    default: return ''
  }
}

const { sortCol, sortDir, onSort: onTableSort, sortItems } = useSortTable({
  defaultCol: 'id', defaultDir: 'asc', avatarAlias: 'uid',
})

const filteredSkills = computed(() => {
  let list = skills.value
  const fa = activeFilters
  if (fa.attr.length) list = list.filter(r => fa.attr.some(a => r.attack_attributes?.includes(a)))
  if (fa.type.length) list = list.filter(r => fa.type.includes(r.type))
  if (fa.state.length) list = list.filter(r => fa.state.includes(r.state))
  if (fa.target.length) list = list.filter(r => {
    const cats = targetCat(getField(r, 'target_name'))
    return fa.target.every(t => cats.includes(t))
  })
  if (fa.wt.length) list = list.filter(r => r.wt != null && fa.wt.includes(r.wt))
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    )
  }
  list = sortItems(list, getSkillSortVal)
  return list
})

const slPage = ref(1)
const slPageSize = ref(50)
const slTotalPages = computed(() => Math.ceil(filteredSkills.value.length / slPageSize.value) || 1)
const pagedSkills = computed(() => {
  const start = (slPage.value - 1) * slPageSize.value
  return filteredSkills.value.slice(start, start + slPageSize.value)
})

watch([() => filteredSkills.value.length, searchText], () => { slPage.value = 1 })

function onSort(col) { onTableSort(col) }
</script>

<template>
  <div v-if="!indexLoaded" class="loading">{{ t('loading') }}</div>
  <template v-else>
  <div class="skf-bar">
    <span class="skf-label">属性</span>
    <button v-for="id in ATTR_IDS" :key="'a'+id"
      class="sf-icon-btn" :class="{ active: activeFilters.attr.includes(id) }"
      @click="toggleFilter('attr', id)"
    ><IconDisplay type="attribute" :id="id" :size="24" /></button>
    <span class="skf-sep"></span>
    <span class="skf-label">种类</span>
    <label v-for="t in TYPE_KEYS" :key="'t'+t" class="skf-check">
      <input type="checkbox" :checked="activeFilters.type.includes(t)" @change="toggleFilter('type',t)">{{ TYPE_LABEL[t] }}
    </label>
    <span class="skf-sep"></span>
    <span class="skf-label">状态</span>
    <label v-for="s in STATE_KEYS" :key="'s'+s" class="skf-check">
      <input type="checkbox" :checked="activeFilters.state.includes(s)" @change="toggleFilter('state',s)">{{ s === '—' ? '其他' : s }}
    </label>
    <span class="skf-sep"></span>
    <span class="skf-label">对象</span>
    <label v-for="t in TARGET_KEYS" :key="'tg'+t" class="skf-check">
      <input type="checkbox" :checked="activeFilters.target.includes(t)" @change="toggleFilter('target',t)">{{ t }}
    </label>
    <span class="skf-sep"></span>
    <span class="skf-label">WT</span>
    <label v-for="w in WT_OPTS" :key="'w'+w" class="skf-check">
      <input type="checkbox" :checked="activeFilters.wt.includes(w)" @change="toggleFilter('wt',w)">{{ w }}
    </label>
    <span class="skf-sep"></span>
    <input type="text" v-model="searchText" placeholder="搜索技能名或描述..." class="skf-search">
  </div>
  <PaginationBar
    :currentPage="slPage" :pageSize="slPageSize"
    :totalPages="slTotalPages" :totalItems="filteredSkills.length"
    :pageSizes="[30, 50, 100, 300, 500, 1000]"
    @update:currentPage="slPage = $event"
    @update:pageSize="slPageSize = $event"
  />
  <SortableTable
    :columns="columns" :rows="pagedSkills" rowKey="_idx"
    :frozen="2" :autoHeight="true"
    :sortCol="sortCol" :sortDir="sortDir" @sort="onSort"
  >
    <template #cell-id="{ row }">{{ row.char_id }}</template>
    <template #cell-avatar="{ row }">
      <div class="ls-avatar-cell">
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
    <template #cell-wait="{ row }">{{ row.wt ?? '—' }}</template>
    <template #cell-limit="{ row }">{{ row.limit_count || '—' }}</template>
    <template #cell-skillName="{ row }">{{ row.name }}</template>
    <template #cell-skillDesc="{ row }"><span v-html="row.description"></span></template>
  </SortableTable>
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
.skf-label { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
.skf-sep { width: 1px; height: 20px; background: var(--overlay-white-15); margin: 0 4px; }
.skf-check { display: flex; align-items: center; gap: 2px; cursor: pointer; font-size: 12px; color: var(--text-muted); }
.skf-check input { accent-color: var(--accent); }
.skf-search {
  width: 180px; font-size: 12px; padding: var(--inp-padding);
  background: var(--overlay-white-08); color: var(--text-light);
  border: 1px solid var(--overlay-white-15); border-radius: var(--radius);
}
.skf-search::placeholder { color: var(--text-muted); }
.skf-search:focus { border-color: var(--accent); }
</style>
