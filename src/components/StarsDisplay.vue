<script setup>
import { computed } from 'vue'
import { getSizePx } from '../composables/useI18n'
import { STAR_LEVEL_MAP } from '../utils/stars'

const props = defineProps({
  rarity: { type: Number, required: true },
  maxRarity: { type: Number },
  size: { type: Number, required: true },
})

const starList = computed(() => {
  const level = STAR_LEVEL_MAP[props.rarity]
  const fullStars = Math.floor(level)
  const hasHalf = level !== fullStars
  const starType = level === 6 ? '999_icon_star_chara_2_pink' : '999_icon_star_chara_2'

  const stars = []
  for (let i = 0; i < fullStars; i++) stars.push(starType)
  if (hasHalf) stars.push('999_icon_star_chara_2_harf')

  if (props.maxRarity != null) {
    const totalSlots = Math.floor(STAR_LEVEL_MAP[props.maxRarity])
    const emptyStars = totalSlots - fullStars - (hasHalf ? 1 : 0)
    for (let i = 0; i < emptyStars; i++) stars.push('999_icon_star_chara_2_1')
  }

  return stars
})

const sizePx = computed(() => getSizePx(0, props.size))

const wrapStyle = computed(() => ({
  width: `${starList.value.length * sizePx.value}px`,
  height: `${sizePx.value}px`,
}))

const rowStyle = computed(() => ({
  display: 'flex',
  transform: `scale(${sizePx.value / 45})`,
  transformOrigin: 'top left',
}))
</script>

<template>
  <div :style="wrapStyle">
    <div :style="rowStyle">
      <div v-for="(type, i) in starList" :key="type + '-' + i" class="star-icon">
        <img :src="'image/misc/' + type + '.webp'">
      </div>
    </div>
  </div>
</template>
