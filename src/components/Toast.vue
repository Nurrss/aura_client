<script setup>
import { useUiStore } from '../stores/uiStore.js'
const ui = useUiStore()

function getToastClass(type) {
  const classes = {
    success: 'text-bg-success',
    error: 'text-bg-danger',
    warning: 'text-bg-warning',
    info: 'text-bg-info',
  }
  return classes[type] || 'text-bg-secondary'
}

function getToastIcon(type) {
  const icons = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill',
  }
  return icons[type] || 'bi-info-circle-fill'
}
</script>

<template>
  <div
    class="toast-container position-fixed top-0 end-0 p-3"
    style="z-index: 1080"
    aria-live="polite"
    aria-atomic="true"
  >
    <div
      v-for="t in ui.toasts"
      :key="t.id"
      class="toast show align-items-center border-0 mb-2"
      :class="getToastClass(t.type)"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi me-2" :class="getToastIcon(t.type)"></i>
          {{ t.message }}
        </div>
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
