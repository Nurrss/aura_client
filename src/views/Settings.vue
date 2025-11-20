<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../api/index.js'

const theme = ref('light')
const focusMin = ref(25)
const shortBreak = ref(5)
const longBreak = ref(15)
const loading = ref(false)
const saving = ref(false)
const warning = ref('')

function applyTheme(t) {
  document.documentElement.setAttribute('data-bs-theme', t)
}

async function loadMe() {
  loading.value = true
  try {
    const { data } = await api.get('/api/users/me')
    const prefs = data?.preferences || {}
    theme.value = prefs.theme === 'dark' ? 'dark' : localStorage.getItem('aura-theme') || 'light'
    focusMin.value =
      prefs.pomodoro?.work ?? parseInt(localStorage.getItem('aura-focus-min') || '25')
    shortBreak.value =
      prefs.pomodoro?.shortBreak ?? parseInt(localStorage.getItem('aura-break-min') || '5')
    longBreak.value =
      prefs.pomodoro?.longBreak ?? parseInt(localStorage.getItem('aura-long-break') || '15')
  } catch (e) {
    theme.value = localStorage.getItem('aura-theme') || 'light'
    focusMin.value = parseInt(localStorage.getItem('aura-focus-min') || '25')
    shortBreak.value = parseInt(localStorage.getItem('aura-break-min') || '5')
    longBreak.value = parseInt(localStorage.getItem('aura-long-break') || '15')
    warning.value = 'Using local preferences (failed to load from server)'
  } finally {
    applyTheme(theme.value)
    loading.value = false
  }
}

onMounted(loadMe)

watch(theme, (t) => {
  localStorage.setItem('aura-theme', t)
  applyTheme(t)
})

async function savePreferences() {
  saving.value = true
  localStorage.setItem('aura-focus-min', String(focusMin.value))
  localStorage.setItem('aura-break-min', String(shortBreak.value))
  localStorage.setItem('aura-long-break', String(longBreak.value))
  localStorage.setItem('aura-theme', theme.value)
  applyTheme(theme.value)
  try {
    await api.patch('/api/users/me', {
      preferences: {
        theme: theme.value,
        pomodoro: {
          work: focusMin.value,
          shortBreak: shortBreak.value,
          longBreak: longBreak.value,
        },
      },
    })
    warning.value = ''
  } catch (e) {
    warning.value = 'Saved locally; failed to save to server.'
  } finally {
    saving.value = false
  }
}

async function resetAll() {
  localStorage.removeItem('aura-theme')
  localStorage.removeItem('aura-focus-min')
  localStorage.removeItem('aura-break-min')
  localStorage.removeItem('aura-long-break')
  theme.value = 'light'
  focusMin.value = 25
  shortBreak.value = 5
  longBreak.value = 15
  applyTheme('light')
  try {
    if (api.delete) await api.delete('/api/users/me/preferences')
    else
      await api.patch('/api/users/me', {
        preferences: { theme: 'light', pomodoro: { work: 25, shortBreak: 5, longBreak: 15 } },
      })
  } catch (e) {
    // ignore
  }
}
</script>

<template>
  <div class="container">
    <h2 class="mb-4">Settings</h2>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading settings...</span>
      </div>
      <p class="mt-3 text-muted">Loading your settings...</p>
    </div>

    <div v-else class="row g-4">
      <div v-if="warning" class="col-12">
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
          {{ warning }}
          <button type="button" class="btn-close" @click="warning = ''" aria-label="Close"></button>
        </div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="card h-100">
          <div class="card-header fw-semibold">Theme</div>
          <div class="card-body">
            <div class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                id="themeToggle"
                v-model="theme"
                true-value="dark"
                false-value="light"
                :disabled="saving"
              />
              <label class="form-check-label" for="themeToggle">{{
                theme === 'dark' ? 'Night' : 'Day'
              }}</label>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="card h-100">
          <div class="card-header fw-semibold">Pomodoro Defaults</div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-4">
                <label for="focusMin" class="form-label">Focus (min)</label>
                <input
                  id="focusMin"
                  type="number"
                  min="1"
                  class="form-control"
                  v-model.number="focusMin"
                  :disabled="saving"
                />
              </div>
              <div class="col-4">
                <label for="shortBreak" class="form-label">Short Break</label>
                <input
                  id="shortBreak"
                  type="number"
                  min="1"
                  class="form-control"
                  v-model.number="shortBreak"
                  :disabled="saving"
                />
              </div>
              <div class="col-4">
                <label for="longBreak" class="form-label">Long Break</label>
                <input
                  id="longBreak"
                  type="number"
                  min="1"
                  class="form-control"
                  v-model.number="longBreak"
                  :disabled="saving"
                />
              </div>
            </div>
            <button class="btn btn-primary mt-3" @click="savePreferences" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="card">
          <div class="card-header fw-semibold">Danger Zone</div>
          <div class="card-body">
            <p class="text-muted mb-3">Reset all settings to default values</p>
            <button class="btn btn-outline-danger" @click="resetAll" :disabled="saving">
              Reset Local Data
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
