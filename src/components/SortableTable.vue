<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },
  frozen: { type: Number, default: 0 },
  sortCol: { type: String, default: '' },
  sortDir: { type: String, default: 'desc' },
})

const emit = defineEmits(['sort'])

function onSort(key) {
  emit('sort', key)
}

function sortArrow(key) {
  if (props.sortCol !== key) return ''
  return props.sortDir === 'desc' ? ' ▼' : ' ▲'
}

// 冻结列 left 偏移累积 + 总宽度
const frozenLefts = computed(() => {
  const lefts = []
  let acc = 0
  for (let i = 0; i < props.columns.length; i++) {
    if (i < props.frozen) {
      lefts.push(acc)
      acc += (props.columns[i].width || 100) - 2
    } else {
      lefts.push(null)
    }
  }
  return lefts
})
const wrapRef = ref(null)
let thObserver = null

onMounted(() => {
  const update = () => {
    if (!wrapRef.value || !props.frozen) return
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
  if (col.align) s.textAlign = col.align
  return s
}
</script>

<template>
  <div ref="wrapRef" class="st-wrap">
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
        <tr v-for="row in rows" :key="row[rowKey]">
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
  border-radius: 12px;
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
  background: #5a5a5a;
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
  width: 100%;
}
.st-table th {
  position: sticky;
  top: 0;
  z-index: 4;
  background: #5a5a5a;
  color: #ddd;
  font-weight: 600;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}
.st-table th,
.st-table td {
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 8px 12px;
  vertical-align: middle;
}
.st-table th { height: 40px; }
.st-table td { height: 88px; overflow: hidden; }
.st-table th:last-child,
.st-table td:last-child {
  border-right: none;
}
.st-table tbody tr:nth-child(even) {
  background: rgba(0,0,0,0.06);
}
</style>
