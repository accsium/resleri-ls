<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useCharacterData } from '../composables/useCharacterData'
import { useI18n } from '../composables/useI18n'
import { useSortTable } from '../composables/useSortTable'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import IconDisplay from '../components/IconDisplay.vue'
import SortableTable from '../components/SortableTable.vue'
import PaginationBar from '../components/PaginationBar.vue'

const { characterIndex, indexLoaded, skillsMap, baseCharacterMap, attrMap: attrData, loadIndex, loadSkills } = useCharacterData()
const { t, currentLang, getField, ATTR_IDS } = useI18n()

const attrMap = computed(() => {
  const m = {}
  for (const [id, entry] of Object.entries(attrData.value)) {
    m[id] = getField(entry, 'name')
  }
  return m
})
const charIndexMap = computed(() => {
  const m = {}; for (const c of characterIndex.value) m[c.id] = c; return m
})

const ready = computed(() => indexLoaded.value && Object.keys(skillsMap.value).length > 0)

const columns = computed(() => [
  { key: 'id', label: t('id'), width: 72, sortVal: (row) => row.char_id },
  { key: 'avatar', label: t('avatar'), width: 88, sortVal: (row) => row.uid },
  { key: 'name', label: t('characterName'), minWidth: 240, sortVal: (row) => getField(row, 'base_name') },
  { key: 'type', label: t('skillTypeLabel'), minWidth: 84, align: 'center', sortVal: (row) => row.type },
  { key: 'state', label: t('skillStateLabel'), minWidth: 72, align: 'center', sortVal: (row) => row.state },
  { key: 'target', label: t('target'), minWidth: 84, align: 'center', sortVal: (row) => getField(row, 'target_name') },
  { key: 'attr', label: t('attribute'), width: 66, align: 'center', sortVal: (row) => { const idx = ATTR_IDS.indexOf(row.attack_attributes?.[0]); return idx === -1 ? 999 : idx } },
  { key: 'dmg', label: t('damage'), width: 66, align: 'center', sortVal: (row) => row.dmg_power ?? -1 },
  { key: 'brk', label: t('breakDef'), width: 66, align: 'center', sortVal: (row) => row.break_power ?? -1 },
  { key: 'heal', label: t('heal'), width: 66, align: 'center', sortVal: (row) => row.heal_power ?? -1 },
  { key: 'wait', label: t('wt'), width: 66, align: 'center', sortVal: (row) => row.wt ?? 9999 },
  { key: 'limit', label: t('limit'), width: 66, align: 'center', sortVal: (row) => row.limit_count ?? 0 },
  { key: 'skillName', label: t('skillName'), minWidth: 240, sortVal: (row) => row.name || '' },
  { key: 'skillDesc', label: t('description'), minWidth: 1200, sortVal: (row) => row.description || '' },
])

const stateLabels = computed(() => ({
  evolve: [t('state_evolve_base'), t('state_evolve_alt')],
  range:  [t('state_range_base'), t('state_range_alt')],
  change: [t('state_change_base'), t('state_change_alt')],
}))

const TYPE_KEYS = ['normal1','normal2','burst','active','ex']
const stateKeys = computed(() => [
  t('state_evolve_base'), t('state_evolve_alt'),
  t('state_range_base'), t('state_range_alt'),
  t('state_change_base'), t('state_change_alt'),
  '—',
])
const WT_OPTS = [0,75,100,150,175,200,225,275,300]
const targetKeys = computed(() => {
  const tf = t('targetFilter')
  return [tf.ally, tf.enemy, tf.single, tf.all, tf.other]
})
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
  const tf = t('targetFilter')
  if (name.includes(tf.enemy)) cats.push(tf.enemy)
  else if (name.includes(tf.ally)) cats.push(tf.ally)
  if (name.includes(tf.single)) cats.push(tf.single)
  else if (name.includes(tf.all)) cats.push(tf.all)
  if (cats.length === 0) cats.push(tf.other)
  return cats
}

function collectSkills(skObj, char, state, imageM) {
  const ALL_TYPES = ['normal1', 'normal2', 'burst', 'active1', 'active2', 'active3']
  const rows = []
  for (const type of ALL_TYPES) {
    const ids = skObj[type] || []
    if (ids.length > 0) {
      const skill = skillsMap.value[ids[ids.length - 1]]
      const displayType = type.startsWith('active') ? 'active' : type
      if (skill) rows.push(buildRow(char, displayType, state, skill, imageM))
    }
  }
  const exIds = skObj.ex || []
  if (exIds.length > 0) {
    const skill = skillsMap.value[exIds[exIds.length - 1]]
    if (skill) rows.push(buildRow(char, 'ex', state, skill, imageM))
  }
  return rows
}

function buildSkillRows() {
  const rows = []
  const sl = stateLabels.value

  for (const char of characterIndex.value) {
    const sk = char.skills || {}
    const sw = char.switch
    const baseState = sw ? (sl[sw]?.[0] || '—') : '—'
    const altState = sw ? (sl[sw]?.[1] || null) : null

    rows.push(...collectSkills(sk, char, baseState))

    if (altState) {
      const altSk = char.switch_stat?.skills
      if (altSk) {
        const altImageM = char.switch_stat.image_M || null
        rows.push(...collectSkills(altSk, char, altState, altImageM))
      }
    }
  }
  return rows
}

function buildRow(char, type, state, skill, imageM) {
  const isHeal = skill.skill_power_type && [5,6,7].includes(skill.skill_power_type)
  const isDmg  = skill.skill_power_type && [1,2,3,4].includes(skill.skill_power_type)
  const bc = baseCharacterMap.value[char.base_character_id]
  return {
    _key: `${char.id}-${type}-${state}`,
    uid: char.uid || '',
    char_id: char.id,
    image_m: imageM || null,
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

const { sortCol, sortDir, onSort, sortItems: sortFn } = useSortTable({ defaultCol: 'uid', defaultDir: 'desc', avatarAlias: 'uid' })

const skills = computed(() => ready.value ? buildSkillRows() : [])

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
  list = sortFn(list, columns.value)
  return list
})

const slPage = ref(1)
const slPageSize = ref(50)
const slTotalPages = computed(() => Math.ceil(filteredSkills.value.length / slPageSize.value) || 1)
const pagedSkills = computed(() => {
  const start = (slPage.value - 1) * slPageSize.value
  return filteredSkills.value.slice(start, start + slPageSize.value)
})

watch(() => filteredSkills.value.length, () => { slPage.value = 1 })

onMounted(async () => {
  await loadIndex()
  await loadSkills()
})
</script>

<template>
  <div v-if="!ready" class="loading">{{ t('loading') }}</div>
  <template v-else>
  <div class="skf-bar">
    <div class="skf-row">
      <div class="skf-group">
        <span class="skf-label">{{ t('attribute') }}</span>
        <button v-for="id in ATTR_IDS" :key="'a'+id"
          class="sf-icon-btn" :class="{ active: activeFilters.attr.includes(id) }"
          @click="toggleFilter('attr', id)"
        ><IconDisplay type="attribute" :id="id" :scale="0" :size="0" /></button>
      </div>
      <span class="skf-sep"></span>
      <div class="skf-group">
        <span class="skf-label">{{ t('skillTypeLabel') }}</span>
        <label v-for="sk in TYPE_KEYS" :key="'t'+sk" class="skf-check">
          <input type="checkbox" :checked="activeFilters.type.includes(sk)" @change="toggleFilter('type',sk)">{{ t('skillType')[sk] }}
        </label>
      </div>
    </div>
    <div class="skf-row">
      <div class="skf-group">
        <span class="skf-label">{{ t('skillStateLabel') }}</span>
        <label v-for="s in stateKeys" :key="'s'+s" class="skf-check">
          <input type="checkbox" :checked="activeFilters.state.includes(s)" @change="toggleFilter('state',s)">{{ s === '—' ? t('targetFilter').other : s }}
        </label>
      </div>
      <span class="skf-sep"></span>
      <div class="skf-group">
        <span class="skf-label">{{ t('target') }}</span>
        <label v-for="tg in targetKeys" :key="'tg'+tg" class="skf-check">
          <input type="checkbox" :checked="activeFilters.target.includes(tg)" @change="toggleFilter('target',tg)">{{ tg }}
        </label>
      </div>
    </div>
    <div class="skf-row">
      <div class="skf-group">
        <span class="skf-label">{{ t('wt') }}</span>
        <label v-for="w in WT_OPTS" :key="'w'+w" class="skf-check">
          <input type="checkbox" :checked="activeFilters.wt.includes(w)" @change="toggleFilter('wt',w)">{{ w }}
        </label>
      </div>
      <input type="text" v-model="searchText" :placeholder="t('skillSearchPlaceholder')" class="skf-search">
    </div>
  </div>
  <PaginationBar
    :currentPage="slPage" :pageSize="slPageSize"
    :totalPages="slTotalPages" :totalItems="filteredSkills.length"
    :pageSizes="[30, 50, 100, 300, 500, 1000]"
    @update:currentPage="slPage = $event"
    @update:pageSize="slPageSize = $event"
  />
  <SortableTable
    :columns="columns" :rows="pagedSkills" rowKey="_key"
    :frozen="2" :autoHeight="true"
    :sortCol="sortCol" :sortDir="sortDir" avatarAlias="uid" @sort="onSort"
  >
    <template #cell-id="{ row }">{{ row.char_id }}</template>
    <template #cell-avatar="{ row }">
      <div class="ls-avatar-cell">
        <AvatarDisplay v-if="charIndexMap[row.char_id]" :indexEntry="charIndexMap[row.char_id]" :scale="2" :size="0" :imageM="row.image_m" />
      </div>
    </template>
    <template #cell-name="{ row }">
      {{ currentLang === 'cn' ? row.base_name_cn : row.base_name_ja }}<template v-if="row.another_name"> <span class="alias-text">{{ row.another_name }}</span></template>
    </template>
    <template #cell-type="{ row }">{{ t('skillType')[row.type] || row.type }}</template>
    <template #cell-state="{ row }">{{ row.state }}</template>
    <template #cell-target="{ row }">
      {{ currentLang === 'cn' ? row.target_name_cn : row.target_name_ja }}
    </template>
    <template #cell-attr="{ row }">
      <IconDisplay v-if="(row.attack_attributes || [])[0]" type="attribute" :id="(row.attack_attributes || [])[0]" :scale="0" :size="0" />
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
  display: grid; gap: 4px;
  padding: 8px 16px;
  background: var(--bg-banner); border-radius: var(--radius-lg);
  margin: 8px auto 0; width: 90%; max-width: 840px;
}
.skf-row {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.skf-group {
  display: flex; flex-wrap: nowrap; align-items: center; gap: 4px;
}
.skf-label { font-size: 12px; color: var(--text-muted); white-space: nowrap; display: inline-block; width: 32px; }
.skf-label::after { content: '：'; }
.skf-sep { width: 1px; height: 20px; background: var(--overlay-white-15); margin: 0 4px; }
.skf-check { display: flex; align-items: center; gap: 2px; cursor: pointer; font-size: 12px; color: var(--text-muted); }
.skf-check input { accent-color: var(--accent); }
.skf-search {
  width: 180px; font-size: 12px; padding: var(--inp-padding);
  background: var(--overlay-white-08); color: var(--text-light);
  border: 1px solid var(--overlay-white-15); border-radius: var(--radius);
  margin-left: auto;
}
.skf-search::placeholder { color: var(--text-muted); }
.skf-search:focus { border-color: var(--accent); }
</style>
