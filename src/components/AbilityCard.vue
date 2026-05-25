<script setup>
import { computed } from 'vue'

const props = defineProps({
  ability: Object,
})

const description = computed(() => {
  let desc = props.ability.description || ''
  if (props.ability.effects) {
    props.ability.effects.forEach((eff, i) => {
      desc = desc.replace(new RegExp(`\\{${i}\\}`, 'g'), (eff.value ?? 0) / 100)
    })
  }
  return desc
})
</script>

<template>
  <div class="skill-desc" v-html="description"></div>
</template>
