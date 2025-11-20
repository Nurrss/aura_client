<script setup>
import { ref, onMounted, watch } from 'vue'
import { useTaskStore } from '../stores/taskStore.js'
import { useHabitStore } from '../stores/habitStore.js'
import { useUiStore } from '../stores/uiStore.js'
import api from '../api/index.js'

const taskStore = useTaskStore()
const habitStore = useHabitStore()
const uiStore = useUiStore()

const theme = ref('light')
const focusMin = ref(25)
const shortBreak = ref(5)
const longBreak = ref(15)
const loading = ref(false)
const saving = ref(false)
const warning = ref('')
const fileInput = ref(null)

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

// Export functionality
async function exportData() {
  try {
    // Load all data
    await Promise.all([taskStore.loadTasks(), habitStore.loadHabits()])

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        tasks: taskStore.tasks,
        habits: habitStore.habits,
        settings: {
          theme: theme.value,
          pomodoro: {
            work: focusMin.value,
            shortBreak: shortBreak.value,
            longBreak: longBreak.value,
          },
        },
      },
    }

    // Create blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aura-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    uiStore.showToast({ type: 'success', message: 'Data exported successfully!' })
  } catch (e) {
    uiStore.showToast({ type: 'error', message: 'Failed to export data' })
    console.error('Export failed:', e)
  }
}

// Import functionality
function triggerImport() {
  fileInput.value?.click()
}

async function handleFileImport(event) {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const importData = JSON.parse(text)

    // Validate structure
    if (!importData.version || !importData.data) {
      throw new Error('Invalid backup file format')
    }

    // Confirm before importing
    if (
      !confirm(
        'This will replace your current data. Make sure you have a backup. Continue?'
      )
    ) {
      return
    }

    // Import tasks
    if (importData.data.tasks && Array.isArray(importData.data.tasks)) {
      for (const task of importData.data.tasks) {
        try {
          await taskStore.createTask({
            title: task.title,
            description: task.description,
            startTime: task.startTime,
            endTime: task.endTime,
            isAllDay: task.isAllDay,
            category: task.category,
            priority: task.priority,
            status: task.status,
          })
        } catch (e) {
          console.error('Failed to import task:', e)
        }
      }
    }

    // Import habits
    if (importData.data.habits && Array.isArray(importData.data.habits)) {
      for (const habit of importData.data.habits) {
        try {
          await habitStore.createHabit({
            title: habit.title,
            frequency: habit.frequency,
            reminderTime: habit.reminderTime,
          })
        } catch (e) {
          console.error('Failed to import habit:', e)
        }
      }
    }

    // Import settings
    if (importData.data.settings) {
      const settings = importData.data.settings
      if (settings.theme) theme.value = settings.theme
      if (settings.pomodoro) {
        focusMin.value = settings.pomodoro.work || 25
        shortBreak.value = settings.pomodoro.shortBreak || 5
        longBreak.value = settings.pomodoro.longBreak || 15
      }
      await savePreferences()
    }

    uiStore.showToast({ type: 'success', message: 'Data imported successfully!' })

    // Reset file input
    event.target.value = ''
  } catch (e) {
    uiStore.showToast({ type: 'error', message: 'Failed to import data: ' + e.message })
    console.error('Import failed:', e)
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
          <div class="card-header fw-semibold">Data Management</div>
          <div class="card-body">
            <p class="text-muted mb-3">
              Export your data to backup or import data from a previous backup
            </p>
            <div class="d-flex gap-2 flex-wrap">
              <button class="btn btn-outline-primary" @click="exportData" :disabled="saving">
                <i class="bi bi-download me-2"></i>
                Export Data
              </button>
              <button class="btn btn-outline-secondary" @click="triggerImport" :disabled="saving">
                <i class="bi bi-upload me-2"></i>
                Import Data
              </button>
              <input
                ref="fileInput"
                type="file"
                accept=".json"
                @change="handleFileImport"
                style="display: none"
              />
            </div>
            <small class="text-muted d-block mt-2">
              Export includes: Tasks, Habits, and Settings
            </small>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="card">
          <div class="card-header fw-semibold">Danger Zone</div>
          <div class="card-body">
            <p class="text-muted mb-3">Reset all settings to default values</p>
            <button class="btn btn-outline-danger" @click="resetAll" :disabled="saving">
              <i class="bi bi-arrow-counterclockwise me-2"></i>
              Reset Local Data
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
