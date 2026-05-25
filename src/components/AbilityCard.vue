<script setup>
import { computed } from 'vue'
import { replaceEffects } from '../utils/effects.js'

const props = defineProps({
  ability: Object,
})

const description = computed(() => replaceEffects(props.ability.description, props.ability.effects))
</script>

<template>
  <div class="skill-desc" v-html="description"></div>
</template>
