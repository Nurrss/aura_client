<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/index.js'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const success = ref(false)
const error = ref(null)

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    error.value = 'Verification token is missing'
    loading.value = false
    return
  }

  try {
    await api.get(`/api/auth/verify-email?token=${token}`)
    success.value = true
    loading.value = false

    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (e) {
    loading.value = false
    error.value = e?.response?.data?.message || 'Verification failed'
  }
})

async function resendVerification() {
  // This would need an API endpoint to resend verification email
  alert('Resend verification email feature not implemented yet')
}
</script>

<template>
  <div class="container" style="max-width: 600px">
    <div class="text-center py-5">
      <h2 class="mb-4">Email Verification</h2>

      <!-- Loading State -->
      <div v-if="loading" class="card">
        <div class="card-body py-5">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Verifying...</span>
          </div>
          <p class="mb-0">Verifying your email address...</p>
        </div>
      </div>

      <!-- Success State -->
      <div v-else-if="success" class="card border-success">
        <div class="card-body py-5">
          <div class="text-success mb-3">
            <i class="bi bi-check-circle" style="font-size: 4rem"></i>
          </div>
          <h4 class="text-success mb-3">Email Verified!</h4>
          <p class="mb-3">Your email has been successfully verified.</p>
          <p class="text-muted small">Redirecting to login page...</p>
          <router-link to="/login" class="btn btn-success mt-2">Go to Login</router-link>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="card border-danger">
        <div class="card-body py-5">
          <div class="text-danger mb-3">
            <i class="bi bi-x-circle" style="font-size: 4rem"></i>
          </div>
          <h4 class="text-danger mb-3">Verification Failed</h4>
          <p class="mb-4">{{ error }}</p>
          <div class="d-flex gap-2 justify-content-center">
            <router-link to="/login" class="btn btn-primary">Go to Login</router-link>
            <button class="btn btn-outline-secondary" @click="resendVerification">
              Resend Verification Email
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bi {
  line-height: 1;
}
</style>
