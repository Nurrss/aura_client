<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const touched = ref({
  email: false,
  password: false,
})

// Validation rules
const emailError = computed(() => {
  if (!touched.value.email) return ''
  if (!email.value.trim()) return 'Email is required'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) return 'Please enter a valid email address'
  return ''
})

const passwordError = computed(() => {
  if (!touched.value.password) return ''
  if (!password.value) return 'Password is required'
  return ''
})

const isFormValid = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) && password.value.length > 0
})

function markTouched(field) {
  touched.value[field] = true
}

async function submit() {
  // Mark all fields as touched
  touched.value.email = true
  touched.value.password = true

  if (!isFormValid.value) return

  const ok = await auth.login({ email: email.value, password: password.value })
  if (ok) {
    // Redirect to the page user was trying to access, or dashboard
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  }
}
</script>

<template>
  <div class="container" style="max-width: 520px">
    <h2 class="mb-4">Login</h2>
    <div class="card">
      <div class="card-body">
        <form @submit.prevent="submit">
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-control"
              :class="{ 'is-invalid': emailError }"
              @blur="markTouched('email')"
              aria-describedby="emailError"
              required
            />
            <div v-if="emailError" id="emailError" class="invalid-feedback">{{ emailError }}</div>
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="form-control"
              :class="{ 'is-invalid': passwordError }"
              @blur="markTouched('password')"
              aria-describedby="passwordError"
              required
            />
            <div v-if="passwordError" id="passwordError" class="invalid-feedback">
              {{ passwordError }}
            </div>
          </div>
          <div v-if="auth.error" class="alert alert-danger">{{ auth.error }}</div>
          <button
            type="submit"
            class="btn btn-primary w-100"
            :disabled="auth.loading || !isFormValid"
          >
            <span v-if="auth.loading" class="spinner-border spinner-border-sm me-2"></span>
            Login
          </button>
          <div class="mt-3 text-center">
            <router-link to="/register" class="text-decoration-none">
              Don't have an account? Register
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
