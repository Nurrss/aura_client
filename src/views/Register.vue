<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'

const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const touched = ref({
  name: false,
  email: false,
  password: false,
})

// Validation rules
const nameError = computed(() => {
  if (!touched.value.name) return ''
  if (!name.value.trim()) return 'Name is required'
  if (name.value.trim().length < 2) return 'Name must be at least 2 characters'
  return ''
})

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
  if (password.value.length < 6) return 'Password must be at least 6 characters'
  return ''
})

const isFormValid = computed(() => {
  return (
    name.value.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) &&
    password.value.length >= 6
  )
})

function markTouched(field) {
  touched.value[field] = true
}

async function submit() {
  // Mark all fields as touched
  touched.value.name = true
  touched.value.email = true
  touched.value.password = true

  if (!isFormValid.value) return

  const ok = await auth.register({ name: name.value, email: email.value, password: password.value })
  if (ok) {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="container" style="max-width: 520px">
    <h2 class="mb-4">Register</h2>
    <div class="card">
      <div class="card-body">
        <form @submit.prevent="submit">
          <div class="mb-3">
            <label for="name" class="form-label">Name</label>
            <input
              id="name"
              v-model="name"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': nameError }"
              @blur="markTouched('name')"
              aria-describedby="nameError"
              required
            />
            <div v-if="nameError" id="nameError" class="invalid-feedback">{{ nameError }}</div>
          </div>
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
              aria-describedby="passwordError passwordHelp"
              required
            />
            <div v-if="passwordError" id="passwordError" class="invalid-feedback">
              {{ passwordError }}
            </div>
            <div v-else id="passwordHelp" class="form-text">
              Password must be at least 6 characters long
            </div>
          </div>
          <div v-if="auth.error" class="alert alert-danger">{{ auth.error }}</div>
          <button
            type="submit"
            class="btn btn-primary w-100"
            :disabled="auth.loading || !isFormValid"
          >
            <span v-if="auth.loading" class="spinner-border spinner-border-sm me-2"></span>
            Create account
          </button>
          <div class="mt-3 text-center">
            <router-link to="/login" class="text-decoration-none">
              Already have an account? Login
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
