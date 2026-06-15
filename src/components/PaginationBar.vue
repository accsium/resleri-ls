<script setup>
import { ref, computed } from 'vue'
import { useFilters } from '../composables/useFilters'

const props = defineProps({
  currentPage: { type: Number, default: null },
  pageSize: { type: Number, default: null },
  totalPages: { type: Number, default: null },
  totalItems: { type: Number, default: null },
  pageSizes: { type: Array, default: null },
})

const emit = defineEmits(['update:currentPage', 'update:pageSize'])

const globalFilters = useFilters()

// props 优先，fallback 到全局 useFilters
const cp = computed({
  get: () => props.currentPage != null ? props.currentPage : globalFilters.currentPage.value,
  set: (v) => {
    if (props.currentPage != null) emit('update:currentPage', v)
    else globalFilters.currentPage.value = v
  }
})
const ps = computed({
  get: () => props.pageSize != null ? props.pageSize : globalFilters.pageSize.value,
  set: (v) => {
    if (props.pageSize != null) emit('update:pageSize', v)
    else globalFilters.pageSize.value = v
  }
})
const tp = computed(() => props.totalPages != null ? props.totalPages : globalFilters.totalPages.value)
const ti = computed(() => props.totalItems)
const sizes = computed(() => props.pageSizes || [30, 50, 100, 300])

const jumpPage = ref('')

function goTo(page) {
  const p = Math.max(1, Math.min(page, tp.value))
  cp.value = p
}

function jump() {
  const p = parseInt(jumpPage.value)
  if (p >= 1 && p <= tp.value) {
    goTo(p)
    jumpPage.value = ''
  }
}

// 生成显示的页码（对象数组，避免省略号重复 key）
const pageNumbers = computed(() => {
  const pages = []
  const total = tp.value
  const cur = cp.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push({ type: 'page', value: i })
    return pages
  }
  const maxShow = 5
  let start = Math.max(1, cur - Math.floor(maxShow / 2))
  let end = Math.min(total, start + maxShow - 1)
  start = Math.max(1, end - maxShow + 1)
  if (start > 1) pages.push({ type: 'page', value: 1 })
  if (start > 2) pages.push({ type: 'ellipsis', pos: 'start' })
  for (let i = start; i <= end; i++) pages.push({ type: 'page', value: i })
  if (end < total - 1) pages.push({ type: 'ellipsis', pos: 'end' })
  if (end < total) pages.push({ type: 'page', value: total })
  return pages
})
</script>

<template>
  <div v-if="tp > 0" class="pg-wrap">
    <div class="pg-bar">
      <button class="pg-btn" :disabled="cp === 1" @click="goTo(1)">&#171;</button>
      <button class="pg-btn" :disabled="cp === 1" @click="goTo(cp - 1)">&#8249;</button>
      <template v-for="p in pageNumbers" :key="p.type === 'ellipsis' ? 'e-' + p.pos : p.value">
        <span v-if="p.type === 'ellipsis'" class="pg-ellipsis">...</span>
        <button v-else class="pg-btn" :class="{ active: cp === p.value }" @click="goTo(p.value)">{{ p.value }}</button>
      </template>
      <button class="pg-btn" :disabled="cp === tp" @click="goTo(cp + 1)">&#8250;</button>
      <button class="pg-btn" :disabled="cp === tp" @click="goTo(tp)">&#187;</button>
      <span class="pg-info">
        共 {{ tp }} 页<template v-if="ti != null">（{{ ti }} 条）</template>
      </span>
      <span class="pg-jump">
        跳到 <input name="jump_page" v-model="jumpPage" class="pg-jump-inp" @keyup.enter="jump" placeholder="页"> 页
      </span>
      <span class="pg-size">
        每页
        <select name="page_size" v-model="ps" class="pg-size-sel">
          <option v-for="s in sizes" :key="s" :value="s">{{ s }}</option>
        </select>
        条
      </span>
    </div>
  </div>
</template>

<style scoped>
.pg-wrap {
  width: 90%;
  max-width: 840px;
  margin: 0 auto;
}
.pg-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 0 8px;
  font-size: 13px;
  flex-wrap: wrap;
}
.pg-size {
  margin-left: auto;
}
.pg-info, .pg-jump, .pg-size {
  color: var(--text-muted);
}
.pg-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.pg-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-light);
}
.pg-ellipsis {
  padding: 0 4px;
  color: var(--text-muted);
}
.pg-jump-inp {
  width: 48px;
  padding: var(--inp-padding);
  font-size: 12px;
  text-align: center;
}
.pg-size-sel {
  padding: var(--sel-padding);
  font-size: 12px;
}
</style>
