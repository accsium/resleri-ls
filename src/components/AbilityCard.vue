<script setup>
import { computed } from 'vue'

const props = defineProps({
  ability: Object,
})

const description = computed(() => props.ability.description || '')
</script>

<template>
  <div class="skill-desc" v-html="description"></div>
</template>
