<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore.js'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')

async function submit() {
  const ok = await auth.login({ email: email.value, password: password.value })
  if (ok) {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="container" style="max-width: 520px">
    <h2 class="mb-4">Login</h2>
    <div class="card">
      <div class="card-body">
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input v-model="email" type="email" class="form-control" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input v-model="password" type="password" class="form-control" required />
        </div>
        <div v-if="auth.error" class="alert alert-danger">{{ auth.error }}</div>
        <button class="btn btn-primary" :disabled="auth.loading" @click="submit">Login</button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
