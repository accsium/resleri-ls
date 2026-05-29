<script setup>
import { ref } from 'vue'
import { useFilters } from '../composables/useFilters'

const { currentPage, pageSize, totalPages } = useFilters()
const jumpPage = ref('')
const PAGE_SIZES = [30, 50, 100, 300, 500]

function goTo(page) {
  const p = Math.max(1, Math.min(page, totalPages.value))
  currentPage.value = p
}

function jump() {
  const p = parseInt(jumpPage.value)
  if (p >= 1 && p <= totalPages.value) {
    goTo(p)
    jumpPage.value = ''
  }
}

// 生成显示的页码
function pageNumbers() {
  const pages = []
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }
  const maxShow = 5
  let start = Math.max(1, cur - Math.floor(maxShow / 2))
  let end = Math.min(total, start + maxShow - 1)
  start = Math.max(1, end - maxShow + 1)
  if (start > 1) pages.push(1)
  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('...')
  if (end < total) pages.push(total)
  return pages
}
</script>

<template>
  <div v-if="totalPages > 0" class="pg-wrap">
    <div class="pg-bar">
      <button class="pg-btn" :disabled="currentPage === 1" @click="goTo(1)">&#171;</button>
      <button class="pg-btn" :disabled="currentPage === 1" @click="goTo(currentPage - 1)">&#8249;</button>
      <template v-for="p in pageNumbers()" :key="p">
        <span v-if="p === '...'" class="pg-ellipsis">...</span>
        <button v-else class="pg-btn" :class="{ active: currentPage === p }" @click="goTo(p)">{{ p }}</button>
      </template>
      <button class="pg-btn" :disabled="currentPage === totalPages" @click="goTo(currentPage + 1)">&#8250;</button>
      <button class="pg-btn" :disabled="currentPage === totalPages" @click="goTo(totalPages)">&#187;</button>
      <span class="pg-info">共 {{ totalPages }} 页</span>
      <span class="pg-jump">
        跳到 <input v-model="jumpPage" class="pg-jump-inp" @keyup.enter="jump" placeholder="页"> 页
      </span>
      <span class="pg-size">
        每页
        <select v-model="pageSize" class="pg-size-sel">
          <option v-for="s in PAGE_SIZES" :key="s" :value="s">{{ s }}</option>
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
  padding: 8px 0;
  font-size: 13px;
  flex-wrap: wrap;
}
.pg-size {
  margin-left: auto;
}
.pg-info, .pg-jump, .pg-size {
  color: var(--text-muted);
}
.pg-btn {
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
}
.pg-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.pg-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.pg-ellipsis {
  padding: 0 4px;
  color: var(--text-muted);
}
.pg-jump-inp {
  width: 48px;
  padding: 2px 4px;
  font-size: 12px;
  text-align: center;
}
.pg-size-sel {
  padding: 2px 6px;
  font-size: 12px;
}
</style>
