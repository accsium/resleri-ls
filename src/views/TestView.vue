<script setup>
import { useCharacterData } from '../composables/useCharacterData'
import AppHeader from '../components/AppHeader.vue'
import NavBar from '../components/NavBar.vue'
import SortFilterBar from '../components/SortFilterBar.vue'
import CharacterCard from '../components/CharacterCard.vue'

const { characterIndex } = useCharacterData()
</script>

<template>
  <AppHeader />
  <NavBar />
  <SortFilterBar />
  <div class="card-container">
    <CharacterCard
      v-for="entry in characterIndex.slice(0, 3)"
      :key="entry.id"
      :index-entry="entry"
    />
  </div>
</template>
