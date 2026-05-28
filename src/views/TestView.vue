<script setup>
import { ref, onMounted } from 'vue'
import { marked } from 'marked'

const todoHtml = ref('')

onMounted(async () => {
  try {
    const res = await fetch('config/todo.md')
    const md = await res.text()
    todoHtml.value = marked.parse(md)
  } catch {
    todoHtml.value = '加载失败'
  }
})
</script>

<template>
  <div class="todo-container">
    <div v-if="todoHtml" class="todo-content" v-html="todoHtml"></div>
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
