import { reactive } from 'vue'

const cardStates = reactive({})

export function useCardState() {
  function getCardState(id) {
    if (!cardStates[id]) {
      cardStates[id] = { toggleActive: false }
    }
    return cardStates[id]
  }

  function setCardState(id, patch) {
    const current = getCardState(id)
    Object.assign(current, patch)
  }

  return { getCardState, setCardState, cardStates }
}
