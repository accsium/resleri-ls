<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useSortTable } from '../composables/useSortTable'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },
  frozen: { type: Number, default: 0 },
  autoHeight: { type: Boolean, default: false },
  defaultSortCol: { type: String, default: '' },
  defaultSortDir: { type: String, default: 'desc' },
  avatarAlias: { type: String, default: '' },
  // 外部排序控制（可选，SkillListView 等预排序场景使用）
  sortCol: { type: String, default: '' },
  sortDir: { type: String, default: '' },
})

const emit = defineEmits(['sort'])

const effectiveDefaultCol = props.defaultSortCol || (props.columns[0]?.key ?? 'id')

const { sortCol: internalCol, sortDir: internalDir, onSort: internalSort, sortItems } = useSortTable({
  defaultCol: effectiveDefaultCol,
  defaultDir: props.defaultSortDir || 'desc',
  avatarAlias: props.avatarAlias || null,
})

const externalMode = computed(() => !!props.sortCol)

const displaySortCol = computed(() => externalMode.value ? props.sortCol : internalCol.value)
const displaySortDir = computed(() => externalMode.value ? props.sortDir : internalDir.value)

const sortedRows = computed(() => {
  if (externalMode.value) return props.rows
  return sortItems(props.rows, props.columns)
})

function onSort(key) {
  if (externalMode.value) {
    emit('sort', key)
  } else {
    internalSort(key)
  }
}

function sortArrow(key) {
  if (displaySortCol.value === key) return displaySortDir.value === 'desc' ? ' ▼' : ' ▲'
  if (props.avatarAlias && key === 'avatar' && displaySortCol.value === props.avatarAlias) return displaySortDir.value === 'desc' ? ' ▼' : ' ▲'
  return ''
}

// 冻结列 left 偏移累积 + 总宽度
const frozenLefts = computed(() => {
  const lefts = []
  let acc = 0
  for (let i = 0; i < props.columns.length; i++) {
    if (i < props.frozen) {
      lefts.push(acc)
      acc += props.columns[i].width || 100
    } else {
      lefts.push(null)
    }
  }
  return lefts
})
const wrapRef = ref(null)
let thObserver = null

onMounted(() => {
  if (!props.frozen) return
  const update = () => {
    if (!wrapRef.value) return
    const thead = wrapRef.value.querySelector('thead')
    if (thead) wrapRef.value.style.setProperty('--frozen-head-h', thead.offsetHeight + 'px')
    const cells = wrapRef.value.querySelectorAll('thead th')
    let w = 0
    for (let i = 0; i < props.frozen && i < cells.length; i++) w += cells[i].offsetWidth
    wrapRef.value.style.setProperty('--frozen-w', w + 'px')
  }
  update()
  thObserver = new ResizeObserver(update)
  const thead = wrapRef.value?.querySelector('thead')
  if (thead) thObserver.observe(thead)
  thObserver.observe(wrapRef.value)
})
onUnmounted(() => { thObserver?.disconnect() })

function frozenStyle(i) {
  const w = props.columns[i].width
  const style = {
    position: 'sticky',
    left: frozenLefts.value[i] + 'px',
    zIndex: 4,
    background: 'var(--bg-card)',
  }
  if (w) style.width = w + 'px'
  return style
}

function frozenThStyle(i) {
  const w = props.columns[i].width
  return {
    position: 'sticky',
    left: frozenLefts.value[i] + 'px',
    zIndex: 6,
    width: w ? w + 'px' : undefined,
  }
}

function cellStyle(col) {
  const s = {}
  if (col.width) s.width = col.width + 'px'
  if (col.minWidth) s.minWidth = col.minWidth + 'px'
  if (col.maxWidth) s.maxWidth = col.maxWidth + 'px'
  if (col.align) s.textAlign = col.align
  return s
}
</script>

<template>
  <div ref="wrapRef" class="st-wrap" :style="autoHeight ? { height: 'auto' } : {}">
    <div v-if="frozen > 0" class="st-frozen-bg"></div>
    <table class="st-table">
      <thead>
        <tr>
          <th
            v-for="(col, i) in columns"
            :key="col.key"
            :style="i < frozen ? frozenThStyle(i) : cellStyle(col)"
            @click="onSort(col.key)"
          >
            {{ col.label }}{{ sortArrow(col.key) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in sortedRows" :key="row[rowKey]">
          <td
            v-for="(col, i) in columns"
            :key="col.key"
            :style="i < frozen ? frozenStyle(i) : cellStyle(col)"
          >
            <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.st-wrap {
  height: calc(100% - 32px);
  width: 90%;
  margin: 16px auto;
  overflow: auto;
  border: 1px solid var(--border);
  position: relative;
  box-sizing: border-box;
}
.st-frozen-bg {
  position: sticky;
  left: 0;
  top: 0;
  z-index: 3;
  width: 100%;
  height: 0;
  overflow: visible;
  pointer-events: none;
  contain: layout;
}
.st-frozen-bg::before {
  content: '';
  display: block;
  width: calc(100% + 6px);
  height: var(--frozen-head-h, 42px);
  background: var(--st-header-bg);
  border-bottom: 1px solid var(--border);
}
.st-frozen-bg::after {
  content: '';
  display: block;
  width: var(--frozen-w, 0px);
  height: 100vh;
  background: var(--bg-card);
}
.st-table {
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
  table-layout: auto;
  width: max-content;
  min-width: 100%;
}
.st-table th {
  position: sticky;
  top: 0;
  z-index: 4;
  background: var(--st-header-bg);
  color: var(--st-header-text);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}
.st-table th,
.st-table td {
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 0px 12px;
  vertical-align: middle;
  height: 24px;
}
.st-table th:last-child,
.st-table td:last-child {
  border-right: none;
}
.st-table tbody tr:nth-child(even) {
  background: var(--overlay-black-06);
}
</style>
