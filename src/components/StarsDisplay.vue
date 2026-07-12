<script setup>
import { computed } from 'vue'
import StarIcon from './StarIcon.vue'

const props = defineProps({
  mode: { type: Number, required: true },
  rarity: { type: Number, required: true },
  maxRarity: { type: Number, required: true },
  scale: { type: Number, default: 1 },
})

const starLevel = { 1:1, 2:2, 3:3, 4:3.5, 5:4, 6:4.5, 7:5, 8:6 }

const starList = computed(() => {
  const level = starLevel[props.rarity]
  const fullStars = Math.floor(level)
  const hasHalf = level !== fullStars
  const starType = level === 6 ? '999_icon_star_chara_2_pink' : '999_icon_star_chara_2'

  const stars = []
  for (let i = 0; i < fullStars; i++) stars.push(starType)
  if (hasHalf) stars.push('999_icon_star_chara_2_harf')

  if (props.mode === 2) {
    const totalSlots = Math.floor(starLevel[props.maxRarity])
    const emptyStars = totalSlots - fullStars - (hasHalf ? 1 : 0)
    for (let i = 0; i < emptyStars; i++) stars.push('999_icon_star_chara_2_1')
  }

  return stars
})

const wrapStyle = computed(() => ({
  width: `${starList.value.length * 45 * props.scale}px`,
  height: `${45 * props.scale}px`,
  overflow: 'visible',
}))

const rowStyle = computed(() => ({
  display: 'flex',
  gap: '0',
  transform: `scale(${props.scale})`,
  transformOrigin: 'top left',
  overflow: 'visible',
}))
</script>

<template>
  <div :style="wrapStyle">
    <div :style="rowStyle">
      <StarIcon
        v-for="(type, i) in starList"
        :key="type + '-' + i"
        :src="'image/misc/' + type + '.webp'"
      />
    </div>
  </div>
</template>
