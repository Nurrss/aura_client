<script setup>
import { useUiStore } from '../stores/uiStore.js'
const ui = useUiStore()
</script>

<template>
  <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1080">
    <div
      v-for="t in ui.toasts"
      :key="t.id"
      class="toast show align-items-center text-bg-success border-0 mb-2"
      :class="{ 'text-bg-danger': t.type === 'error', 'text-bg-success': t.type === 'success' }"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="d-flex">
        <div class="toast-body">{{ t.message }}</div>
        <button
          type="button"
          class="btn-close btn-close-white me-2 m-auto"
          aria-label="Close"
          @click="ui.dismissToast(t.id)"
        ></button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
