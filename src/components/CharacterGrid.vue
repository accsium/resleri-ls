<script setup>
import { useFilters } from '../composables/useFilters'
import CharacterCard from './CharacterCard.vue'

const { filteredCharacters } = useFilters()
</script>

<template>
  <CharacterCard
    v-for="entry in filteredCharacters"
    :key="entry.id"
    :index-entry="entry"
  />
</template>
