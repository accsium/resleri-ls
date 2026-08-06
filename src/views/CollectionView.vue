<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n, getSizePx } from '../composables/useI18n'
import { useCharacterData } from '../composables/useCharacterData'
import { useCollection } from '../composables/useCollection'
import AvatarDisplay from '../components/AvatarDisplay.vue'
import CollectionMatrix from '../components/CollectionMatrix.vue'
import FilterBar from '../components/FilterBar.vue'
import { useFilters, filterCharacter } from '../composables/useFilters'
import { useLocalStorage } from '../composables/useLocalStorage'

defineOptions({ name: 'CollectionView' })

const { t } = useI18n()
const { characterIndex, indexLoaded, loadIndex, loadTraits } = useCharacterData()
const { ownedIds, ownedCount, shareCode, isOwned, toggleOwned, batchToggle, saveToStorage, loadFromCode } = useCollection()
const { activeFilters, resetFilters } = useFilters()

// ── 视图模式 ──
// ── UI 状态持久化 ──
const viewMode = useLocalStorage('resleri-ui-viewMode', 'sequential')
const _seqPx = useLocalStorage('resleri-ui-seqPx', 96)
const _matPx = useLocalStorage('resleri-ui-matPx', 48)
const colorMode = useLocalStorage('resleri-ui-colorMode', false)

/** px → size，始终写回规范化 px */
const _restoreSize = (pxRef, scale) => {
  const raw = (pxRef.value >> (scale + 2)) - 3
  const s = raw >= 0 && raw <= 7 ? raw : 3
  pxRef.value = getSizePx(scale, s)
  return s
}
const seqSize = computed({ get: () => _restoreSize(_seqPx, 2), set: s => _seqPx.value = getSizePx(2, s) })
const matSize = computed({ get: () => _restoreSize(_matPx, 1), set: s => _matPx.value = getSizePx(1, s) })

const sizeSteps = computed(() => {
  const cur = viewMode.value === 'sequential' ? seqSize.value : matSize.value
  return Array.from({ length: 8 }, (_, i) => ({ val: i, active: i === cur, below: i < cur }))
})
const seqGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(auto-fill, ${getSizePx(2, seqSize.value)}px)`,
  gridAutoRows: `${getSizePx(2, seqSize.value)}px`,
}))

// ── 从 URL 分享码初始化 ──
const codeFromUrl = computed(() => new URLSearchParams(location.search).get('code') || null)

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
let saveTimer = null
let copyTimer = null

function onLoadCode() {
  if (shareInput.value) {
    loadFromCode(shareInput.value, characterIndex.value)
  }
}

// ── 拖拽选择 ──
const dragging = ref(false)
const dragAction = ref(null)
let processedIds = new Set()

function onPointerDown(id) {
  const owned = isOwned(id)
  toggleOwned(id)
  if (!showOwned.value || !showUnowned.value) return
  dragging.value = true
  dragAction.value = owned ? 'remove' : 'add'
}

function onPointerOver(id) {
  if (!dragging.value || processedIds.has(id)) return
  const owned = isOwned(id)
  if (dragAction.value === 'add' && !owned) toggleOwned(id)
  else if (dragAction.value === 'remove' && owned) toggleOwned(id)
  else return
  processedIds.add(id)
}

let _rafId = null

function onPointerMove(e) {
  if (!dragging.value) return
  if (_rafId) return
  _rafId = requestAnimationFrame(() => {
    _rafId = null
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const item = el?.closest('.collection-avatar-item')
    if (item?.dataset.id) onPointerOver(Number(item.dataset.id))
  })
}

function onPointerUp() {
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null }
  dragging.value = false
  dragAction.value = null
  processedIds = new Set()
}
function selectAll() {
  const unowned = characterIndex.value.filter(c => !isOwned(c.id)).map(c => c.id)
  if (unowned.length) batchToggle(unowned, true)
}
function invertSelect() {
  const toAdd = []; const toRemove = []
  for (const c of characterIndex.value) {
    if (isOwned(c.id)) toRemove.push(c.id)
    else toAdd.push(c.id)
  }
  if (toAdd.length) batchToggle(toAdd, true)
  if (toRemove.length) batchToggle(toRemove, false)
}
function onSave() {
  const ok = saveToStorage()
  if (!ok) {
    alert(t('saveFailed'))
    return
  }
  savedFlash.value = true
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => { savedFlash.value = false }, 1500)
}

async function onCopyLink() {
  const url = `${window.location.origin}${window.location.pathname}?code=${encodeURIComponent(shareCode.value)}`
  try {
    await navigator.clipboard.writeText(url)
    copiedFlash.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copiedFlash.value = false }, 1500)
  } catch { /* clipboard not available */ }
}

// ── 加载状态 ──
const isLoaded = computed(() => indexLoaded.value)

// 防止拖拽/选中
const layoutRef = ref(null)
onMounted(async () => {
  await loadIndex()
  loadTraits()
  resetFilters()
})
onUnmounted(() => {
  clearTimeout(saveTimer)
  clearTimeout(copyTimer)
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
        <button class="collection-ctrl-btn" @click="onLoadCode">{{ t('loadCode') }}</button>
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
          <label class="collection-check"><input type="checkbox" v-model="showOwned">{{ t('owned') }}</label>
          <label class="collection-check"><input type="checkbox" v-model="showUnowned">{{ t('unowned') }}</label>
          <button class="collection-color-btn" @click="colorMode = !colorMode">{{ colorMode ? t('colorLabel') : t('bwLabel') }}</button>
          <button class="collection-color-btn" @click="selectAll">{{ t('selectAll') }}</button>
          <button class="collection-color-btn" @click="invertSelect">{{ t('invertSelect') }}</button>
        </span>
        <span class="collection-size-group" v-if="viewMode === 'sequential'">
          <span class="collection-size-label">{{ t('avatarSize') }}</span>
          <span class="size-steps">
            <span v-for="s in sizeSteps" :key="s.val" class="size-step" :class="{ active: s.active, below: s.below }" @click="seqSize = s.val"></span>
          </span>
        </span>
        <span class="collection-size-group" v-else>
          <span class="collection-size-label">{{ t('avatarSize') }}</span>
          <span class="size-steps">
            <span v-for="s in sizeSteps" :key="s.val" class="size-step" :class="{ active: s.active, below: s.below }" @click="matSize = s.val"></span>
          </span>
        </span>
      </div>

      <!-- 列表模式 -->
      <div v-if="viewMode === 'sequential'" class="avatar-grid" :style="seqGridStyle" @pointerup="onPointerUp" @pointerleave="onPointerUp" @pointermove="onPointerMove" @dragstart.prevent>
        <div
          v-for="entry in filteredSortedCharacters"
          :key="entry.id"
          class="collection-avatar-item"
          :class="{ owned: isOwned(entry.id) }"
          :data-id="entry.id"
          @pointerdown="onPointerDown(entry.id)"
        >
          <AvatarDisplay :index-entry="entry" :scale="2" :size="seqSize" />
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
        @pointermove="onPointerOver"
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
  padding: var(--inp-padding);
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
  color: var(--sf-active-text);
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
  background: var(--size-step-bg);
  border: 0.2px solid var(--size-step-border);
  cursor: pointer;
  box-sizing: border-box;
  margin-left: -1px;
}
.size-step:first-child { margin-left: 0; }
.size-step.below { background: var(--sf-toggle-hov); }
.size-step.active { background: var(--size-step-active); }


/* 矩阵深色格子 */
.collection-layout :deep(.matrix-cell) {
  background: var(--avatar-grid-bg);
}
.collection-layout :deep(.matrix-attr-label) {
  background: var(--avatar-grid-bg);
  color: var(--overlay-white-50);
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
.collection-layout :deep(.avatar-component, .memoria-component, .memoria-m-component) {
  user-select: none;
  -webkit-user-select: none;
}
</style>
