<script setup>
import StarIcon from '../components/StarIcon.vue'

const types = ['star_0', 'star_1', 'star_2', 'star_3']
function randomType() { return types[Math.floor(Math.random() * types.length)] }

const rows = Array.from({ length: 10 }, () =>
  Array.from({ length: 6 }, () => randomType())
)
</script>

<template>
  <div style="padding: 40px; display: flex; flex-direction: column; gap: 16px;">
    <div v-for="(row, i) in rows" :key="i" style="display: flex; gap: 0;">
      <StarIcon
        v-for="(t, j) in row" :key="j"
        :src="'image/misc/' + t + '.png'"
      />
    </div>
  </div>
</template>
