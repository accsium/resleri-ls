<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import { useCollection } from '../composables/useCollection'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import CollectionMatrix from '../components/CollectionMatrix.vue'
import FilterBar from '../components/FilterBar.vue'
import { useFilters, filterCharacter } from '../composables/useFilters'
import { useLocalStorage } from '../composables/useLocalStorage'

const { t } = useI18n()
const { characterIndex } = useCharacterData()
const { ownedIds, ownedCount, shareCode, isOwned, toggleOwned, saveToStorage, loadFromCode } = useCollection()
const { activeFilters, resetFilters } = useFilters()
const route = useRoute()

// ── 视图模式 ──
// ── UI 状态持久化 ──
const viewMode = useLocalStorage('resleri-ui-viewMode', 'sequential')
const seqSize = useLocalStorage('resleri-ui-seqSize', 96)
const matSize = useLocalStorage('resleri-ui-matSize', 48)
const colorMode = useLocalStorage('resleri-ui-colorMode', false)
const sizeSteps = computed(() => {
  const min = viewMode.value === 'sequential' ? 48 : 24
  const max = viewMode.value === 'sequential' ? 160 : 80
  const step = viewMode.value === 'sequential' ? 16 : 8
  const cur = viewMode.value === 'sequential' ? seqSize.value : matSize.value
  const steps = []
  for (let s = min; s <= max; s += step) steps.push({ val: s, active: s === cur, below: s < cur })
  return steps
})
const seqGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(auto-fill, ${seqSize.value}px)`,
  gridAutoRows: `${seqSize.value}px`,
  '--item-w': `${seqSize.value}px`,
}))

// ── 从 URL 分享码初始化 ──
const codeFromUrl = computed(() => route.params.code || null)

watch([() => characterIndex.value.length, codeFromUrl], ([len, code]) => {
  if (len === 0) return
  if (code) {
    loadFromCode(code, characterIndex.value)
    // 无效 code 视为无 code，保持 localStorage 数据
  }
}, { immediate: true })

// ── 筛选 + 排序 ──
const filteredSortedCharacters = computed(() => {
  // 使用共享的 filterCharacter 纯函数
  let list = characterIndex.value.filter(c => filterCharacter(c, activeFilters))

  // 拥有筛选（CollectionView 独有）
  if (!showOwned.value || !showUnowned.value) {
    list = list.filter(c => {
      const owned = isOwned(c.id)
      if (owned && !showOwned.value) return false
      if (!owned && !showUnowned.value) return false
      return true
    })
  }

  // UID 倒序（最新在前）
  list.sort((a, b) => (b.uid || '').localeCompare(a.uid || ''))
  return list
})

const noMatch = computed(() => filteredSortedCharacters.value.length === 0)

// ── 拥有筛选 ──
const showOwned = useLocalStorage('resleri-ui-showOwned', true)
const showUnowned = useLocalStorage('resleri-ui-showUnowned', true)

// ── 操作 ──
const shareInput = ref('')
const savedFlash = ref(false)
const copiedFlash = ref(false)

function onLoadCode() {
  if (shareInput.value) {
    loadFromCode(shareInput.value, characterIndex.value)
  }
}

// ── 拖拽选择 ──
const dragging = ref(false)
const dragAction = ref(null)
function onPointerDown(id) {
  const owned = isOwned(id)
  toggleOwned(id)
  if (!showOwned.value || !showUnowned.value) return
  dragging.value = true
  dragAction.value = owned ? 'remove' : 'add'
}
function onPointerEnter(id) {
  if (!dragging.value) return
  const owned = isOwned(id)
  if (dragAction.value === 'add' && !owned) toggleOwned(id)
  else if (dragAction.value === 'remove' && owned) toggleOwned(id)
}
function onPointerUp() {
  dragging.value = false
  dragAction.value = null
}
function onKeydown(id, e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    onPointerDown(id)
  }
}
function selectAll() {
  for (const c of characterIndex.value) {
    if (!isOwned(c.id)) toggleOwned(c.id)
  }
}
function invertSelect() {
  for (const c of characterIndex.value) toggleOwned(c.id)
}
function onSave() {
  saveToStorage()
  savedFlash.value = true
  setTimeout(() => { savedFlash.value = false }, 1500)
}

async function onCopyLink() {
  const url = `${window.location.origin}${window.location.pathname}#/collection/${shareCode.value}`
  try {
    await navigator.clipboard.writeText(url)
    copiedFlash.value = true
    setTimeout(() => { copiedFlash.value = false }, 1500)
  } catch { /* clipboard not available */ }
}

// ── 加载状态 ──
const isLoaded = computed(() => characterIndex.value.length > 0)

// 防止拖拽/选中
const layoutRef = ref(null)
onMounted(() => {
  resetFilters()
  // selectstart/dragstart 已通过模板 @selectstart.prevent @dragstart.prevent 处理
})
</script>

<template>
  <div ref="layoutRef" class="collection-layout" :class="{ 'color-mode': colorMode }" @selectstart.prevent>
    <div v-if="!isLoaded" class="loading">{{ t('loading') }}</div>

    <template v-else>
      <!-- 控栏：保存 + 计数 + 分享码 -->
      <div class="collection-controls">
        <span class="collection-count">{{ t('collectionOwnedCount').replace('{n}', ownedCount).replace('{total}', characterIndex.length) }}</span>
        <button class="collection-ctrl-btn" @click="onSave">
          {{ savedFlash ? t('collectionSaved') : t('collectionSave') }}
        </button>
        <input type="text" v-model="shareInput" class="collection-share-input" :placeholder="shareCode">
        <button class="collection-ctrl-btn" @click="onLoadCode">读取</button>
        <button class="collection-ctrl-btn" @click="onCopyLink">
          {{ copiedFlash ? t('collectionCopied') : t('collectionCopyLink') }}
        </button>
      </div>

      <!-- 筛选栏 -->
      <FilterBar />

      <!-- 模式切换 -->
      <div class="collection-mode-bar">
        <span class="collection-mode-btns">
          <button
            :class="{ active: viewMode === 'sequential' }"
            @click="viewMode = 'sequential'"
          >{{ t('collectionSequential') }}</button>
          <button
            :class="{ active: viewMode === 'matrix' }"
            @click="viewMode = 'matrix'"
          >{{ t('collectionMatrix') }}</button>
          <label class="collection-check"><input type="checkbox" v-model="showOwned">已拥有</label>
          <label class="collection-check"><input type="checkbox" v-model="showUnowned">未拥有</label>
          <button class="collection-color-btn" @click="colorMode = !colorMode">{{ colorMode ? '彩色' : '黑白' }}</button>
          <button class="collection-color-btn" @click="selectAll">全选</button>
          <button class="collection-color-btn" @click="invertSelect">反选</button>
        </span>
        <span class="collection-size-group" v-if="viewMode === 'sequential'">
          <span class="collection-size-label">头像尺寸</span>
          <span class="size-steps">
            <span v-for="s in sizeSteps" :key="s.val" class="size-step" :class="{ active: s.active, below: s.below }" @click="seqSize = s.val"></span>
          </span>
        </span>
        <span class="collection-size-group" v-else>
          <span class="collection-size-label">头像尺寸</span>
          <span class="size-steps">
            <span v-for="s in sizeSteps" :key="s.val" class="size-step" :class="{ active: s.active, below: s.below }" @click="matSize = s.val"></span>
          </span>
        </span>
      </div>

      <!-- 列表模式 -->
      <div v-if="viewMode === 'sequential'" class="avatar-grid" :style="seqGridStyle" @pointerup="onPointerUp" @pointerleave="onPointerUp" @dragstart.prevent>
        <div
          v-for="entry in filteredSortedCharacters"
          :key="entry.id"
          class="collection-avatar-item"
          :class="{ owned: isOwned(entry.id) }"
          role="button" tabindex="0"
          @pointerdown="onPointerDown(entry.id)"
          @pointerenter="onPointerEnter(entry.id)"
          @keydown="onKeydown(entry.id, $event)"
        >
          <AvatarDisplay :index-entry="entry" :size="seqSize" />
        </div>
        <div v-if="noMatch" class="collection-empty">{{ t('collectionNoMatch') }}</div>
      </div>

      <!-- 矩阵模式 -->
      <CollectionMatrix
        v-else
        :characters="filteredSortedCharacters"
        :owned-set="ownedIds"
        :size="matSize"
        @pointerdown="onPointerDown"
        @pointerenter="onPointerEnter"
        @pointerup="onPointerUp"
      />
    </template>
  </div>
</template>

<style scoped>
.collection-layout {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 0 20px;
  user-select: none;
}

.collection-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  flex-wrap: wrap;
}

.collection-count {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}

.collection-ctrl-btn {
  white-space: nowrap;
}
.collection-ctrl-btn:hover {
  background: var(--bg-stat);
}

.collection-share-input {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-family: monospace;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-stat);
  color: var(--text-primary);
}

/* 模式切换 */
.collection-mode-bar {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}
.collection-mode-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}
.collection-mode-bar button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}
.collection-mode-bar button.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.collection-check {
  font-size: 12px;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  margin-left: 8px;
}
.collection-check input {
  accent-color: var(--accent);
}
.collection-size-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: 12px;
}
.collection-size-group {
  display: flex;
  align-items: center;
  gap: 2px;
}
.size-steps {
  display: flex;
  align-items: center;
}
.size-step {
  width: 10px; height: 10px;
  background: #5a6a7e;
  border: 0.2px solid #000;
  cursor: pointer;
  box-sizing: border-box;
  margin-left: -1px;
}
.size-step:first-child { margin-left: 0; }
.size-step.below { background: #42a5f5; }
.size-step.active { background: #fdd835; }

/* 列表模式 */
.collection-sequential .collection-avatar-item {
  width: var(--item-w);
  height: var(--item-w);
}

/* 矩阵深色格子 */
.collection-layout :deep(.matrix-cell) {
  background: #4a515e;
}
.collection-layout :deep(.matrix-attr-label) {
  background: #4a515e;
  color: rgba(255,255,255,0.5);
}

.collection-empty {
  text-align: center;
  color: var(--text-muted);
  padding: 40px;
  grid-column: 1 / -1;
}

/* 筛选用 wrapper（复用 global.css 的 sf-* 类，这里只做容器调整） */
.collection-layout :deep(.sf-wrapper) {
  margin: 0;
}
.collection-layout :deep(.sort-filter-bar) {
  border-radius: var(--radius-lg);
}
</style>
