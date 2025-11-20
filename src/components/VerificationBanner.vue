<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore.js'
import api from '../api/index.js'

const authStore = useAuthStore()
const isVerified = ref(true)
const loading = ref(true)
const dismissed = ref(false)

const showBanner = computed(() => {
  return authStore.isAuthenticated && !isVerified.value && !dismissed.value
})

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    loading.value = false
    return
  }

  try {
    const { data } = await api.get('/api/users/me')
    isVerified.value = data.isVerified
  } catch (e) {
    console.error('Failed to check verification status:', e)
  } finally {
    loading.value = false
  }
})

function dismiss() {
  dismissed.value = true
}

async function resendVerification() {
  // This would need an API endpoint to resend verification email
  alert('Resend verification email feature not implemented yet')
}
</script>

<template>
  <div v-if="showBanner" class="alert alert-warning alert-dismissible fade show m-0 rounded-0" role="alert">
    <div class="container-fluid">
      <div class="d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>
            <strong>Email not verified.</strong> Please check your inbox for a verification email.
          </span>
        </div>
        <button
          type="button"
          class="btn btn-sm btn-outline-warning"
          @click="resendVerification"
        >
          Resend Email
        </button>
        <button
          type="button"
          class="btn-close"
          @click="dismiss"
          aria-label="Close"
        ></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alert {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  z-index: 1040;
}
</style>
