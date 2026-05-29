<script setup>
import { useFilters } from '../composables/useFilters'
import CharacterCard from './CharacterCard.vue'

const { pagedCharacters } = useFilters()
</script>

<template>
  <CharacterCard
    v-for="entry in pagedCharacters"
    :key="entry.id"
    :index-entry="entry"
  />
</template>
