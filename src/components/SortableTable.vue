<script setup>
import { computed } from 'vue'

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

// 冻结列 left 偏移累积
const frozenLefts = computed(() => {
  const lefts = []
  let acc = 0
  for (let i = 0; i < props.columns.length; i++) {
    if (i < props.frozen) {
      lefts.push(acc)
      acc += (props.columns[i].width || 100)
    } else {
      lefts.push(null)
    }
  }
  return lefts
})

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
  return { ...frozenStyle(i), zIndex: 6 }
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
  <div class="st-wrap">
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
  height: 100%;
  width: 90%;
  margin: 0 auto;
  overflow: auto;
}
.st-table {
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
  table-layout: fixed;
  width: max-content;
  min-width: 100%;
}
.st-table th {
  position: sticky;
  top: 0;
  z-index: 2;
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
.st-table th:first-child,
.st-table td:first-child {
  border-left: 1px solid var(--border);
}
.st-table th:last-child,
.st-table td:last-child {
  border-right: none;
}
.st-table tbody tr:nth-child(even) {
  background: rgba(0,0,0,0.06);
}
</style>
