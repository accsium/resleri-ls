<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { marked } from 'marked'
import { preFetch } from '../router'

const todoHtml = ref('')
const isProd = import.meta.env.PROD

/** 移除 marked 输出中的危险 HTML（script/iframe/事件处理器） */
function _sanitize(html) {
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\s(on\w+)=/gi, ' data-x-$1=')
}

let abortController = null

onMounted(async () => {
  abortController = new AbortController()
  const { signal } = abortController
  try {
    let md = await preFetch.todo
    if (!md) {
      const res = await fetch('config/todo.md', { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      md = await res.text()
    }
    if (signal.aborted) return
    todoHtml.value = _sanitize(marked.parse(md))
  } catch {
    if (signal.aborted) return
    todoHtml.value = '加载失败'
  }
})

onUnmounted(() => {
  abortController?.abort()
})
</script>

<template>
  <div class="todo-container">
    <template v-if="todoHtml">
      <div v-if="!isProd" class="todo-content" v-html="todoHtml"></div>
      <div v-else class="todo-content">该页面仅在开发模式下可用</div>
    </template>
    <div v-else class="todo-content">加载中...</div>
  </div>
</template>

<style scoped>
.todo-container {
  margin: 16px;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: 13px;
}
.todo-content :deep(h1),
.todo-content :deep(h2),
.todo-content :deep(h3) {
  margin: 0 0 8px;
  color: var(--text-primary);
}
.todo-content :deep(ul), .todo-content :deep(ol) {
  margin: 0 0 8px;
  padding-left: 24px;
}
.todo-content :deep(li) {
  margin-bottom: 4px;
}
.todo-content :deep(p) {
  margin: 0 0 8px;
}
.todo-content :deep(code) {
  background: var(--bg-stat);
  padding: 2px 6px;
  border-radius: var(--radius);
}
.todo-content :deep(pre) {
  background: var(--bg-stat);
  padding: 12px;
  border-radius: var(--radius);
  overflow-x: auto;
}
</style>
