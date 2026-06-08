<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import AvatarDisplay from './AvatarDisplay.vue'
import IconDisplay from './IconDisplay.vue'

const props = defineProps({
  characters: { type: Array, required: true },
  ownedSet: { type: Object, required: true },
})

const emit = defineEmits(['toggle'])

const { currentLang, ATTR_MAP, ATTR_MAP_CN, ROLE_MAP, ROLE_MAP_CN } = useI18n()

const attrMap = computed(() => currentLang.value === 'cn' ? ATTR_MAP_CN : ATTR_MAP)
const roleMap = computed(() => currentLang.value === 'cn' ? ROLE_MAP_CN : ROLE_MAP)

const ROLE_IDS = [1, 2, 3, 4]
const ATTR_IDS = [1, 2, 3, 5, 6, 7, 8]

// 按 (role, attr) 预分组
const cellMap = computed(() => {
  const map = {}
  for (const rid of ROLE_IDS) {
    for (const aid of ATTR_IDS) {
      map[`${rid}-${aid}`] = []
    }
  }
  for (const c of props.characters) {
    const role = c.role
    const attr = (c.attack_attributes || [])[0]
    if (role != null && attr != null) {
      const key = `${role}-${attr}`
      if (map[key]) map[key].push(c)
    }
  }
  return map
})

function getCell(rid, aid) {
  return cellMap.value[`${rid}-${aid}`] || []
}
</script>

<template>
  <table class="collection-matrix">
    <thead>
      <tr>
        <th class="matrix-corner"></th>
        <th v-for="rid in ROLE_IDS" :key="'rh'+rid" class="matrix-role-hd">
          <IconDisplay type="role" :id="rid" :size="18" />
          <span>{{ roleMap[rid] }}</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="aid in ATTR_IDS" :key="'ar'+aid">
        <td class="matrix-attr-label">
          <IconDisplay type="attribute" :id="aid" :size="18" />
          <span>{{ attrMap[aid] }}</span>
        </td>
        <td v-for="rid in ROLE_IDS" :key="'c'+rid+'-'+aid" class="matrix-cell">
          <div class="matrix-cell-inner">
            <div
              v-for="entry in getCell(rid, aid)"
              :key="entry.id"
              class="collection-avatar-item"
              :class="{ owned: ownedSet.has(entry.id) }"
              @click="emit('toggle', entry.id)"
            >
              <AvatarDisplay :index-entry="entry" :size="56" />
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.collection-matrix {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 4px;
}

.matrix-corner {
  width: 56px;
}

.matrix-role-hd {
  text-align: center;
  font-size: 12px;
  padding: 6px 8px;
  background: var(--bg-banner);
  color: var(--text-light);
  border-radius: var(--radius);
  white-space: nowrap;
}
.matrix-role-hd span {
  display: block;
  margin-top: 2px;
}

.matrix-attr-label {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  padding: 4px 8px;
  background: var(--bg-stat);
  border-radius: var(--radius);
  white-space: nowrap;
}
.matrix-attr-label span {
  display: block;
  margin-top: 2px;
}

.matrix-cell {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 4px;
  min-width: 64px;
  min-height: 64px;
  vertical-align: top;
}
.matrix-cell-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: flex-start;
  align-content: flex-start;
}
</style>
