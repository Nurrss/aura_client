<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTaskStore } from '../stores/taskStore.js'
import { useHabitStore } from '../stores/habitStore.js'
import { useAuthStore } from '../stores/authStore.js'
import { getReports } from '../api/reports.js'
import api from '../api/index.js'
import dayjs from 'dayjs'

const taskStore = useTaskStore()
const habitStore = useHabitStore()
const authStore = useAuthStore()

const loading = ref(true)
const userInfo = ref(null)
const reports = ref([])

// Computed statistics
const totalTasks = computed(() => taskStore.tasks.length)
const completedTasks = computed(() => taskStore.tasks.filter((t) => t.status === 'completed').length)
const completionRate = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((completedTasks.value / totalTasks.value) * 100)
})

const totalHabits = computed(() => habitStore.habits.length)
const activeStreaks = computed(() => habitStore.habits.filter((h) => h.streak > 0).length)
const longestStreak = computed(() => {
  if (habitStore.habits.length === 0) return 0
  return Math.max(...habitStore.habits.map((h) => h.streak || 0))
})

const totalFocusMinutes = computed(() => {
  return reports.value.reduce((sum, r) => sum + (r.focusMinutes || 0), 0)
})

const totalFocusHours = computed(() => {
  return Math.floor(totalFocusMinutes.value / 60)
})

const averageFocusPerDay = computed(() => {
  if (reports.value.length === 0) return 0
  return Math.round(totalFocusMinutes.value / reports.value.length)
})

const memberSince = computed(() => {
  if (!userInfo.value?.createdAt) return 'N/A'
  return dayjs(userInfo.value.createdAt).format('MMMM D, YYYY')
})

const accountAge = computed(() => {
  if (!userInfo.value?.createdAt) return 0
  return dayjs().diff(dayjs(userInfo.value.createdAt), 'day')
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      loadUserInfo(),
      taskStore.loadTasks(),
      habitStore.loadHabits(),
      loadReports(),
    ])
  } catch (e) {
    console.error('Failed to load profile data:', e)
  } finally {
    loading.value = false
  }
})

async function loadUserInfo() {
  try {
    const { data } = await api.get('/api/users/me')
    userInfo.value = data
  } catch (e) {
    console.error('Failed to load user info:', e)
  }
}

async function loadReports() {
  try {
    const now = new Date()
    const from = new Date()
    from.setDate(now.getDate() - 30)
    const resp = await getReports({ from: from.toISOString(), to: now.toISOString() })
    reports.value = Array.isArray(resp) ? resp : []
  } catch (e) {
    console.error('Failed to load reports:', e)
  }
}

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<template>
  <div class="container">
    <h2 class="mb-4">Profile</h2>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading profile...</span>
      </div>
      <p class="mt-3 text-muted">Loading your profile...</p>
    </div>

    <div v-else class="row g-4">
      <!-- User Info Card -->
      <div class="col-12 col-lg-4">
        <div class="card h-100">
          <div class="card-body text-center">
            <div
              class="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
              style="width: 100px; height: 100px; font-size: 2rem; font-weight: bold"
            >
              {{ getInitials(userInfo?.name) }}
            </div>
            <h4 class="card-title mb-2">{{ userInfo?.name || 'User' }}</h4>
            <p class="text-muted mb-3">{{ userInfo?.email || 'No email' }}</p>
            <div class="mb-2">
              <span
                class="badge"
                :class="userInfo?.isVerified ? 'bg-success' : 'bg-warning'"
              >
                {{ userInfo?.isVerified ? 'Verified' : 'Not Verified' }}
              </span>
            </div>
            <hr />
            <div class="text-start">
              <small class="text-muted d-block mb-1">
                <i class="bi bi-calendar3 me-2"></i>
                Member since: {{ memberSince }}
              </small>
              <small class="text-muted d-block">
                <i class="bi bi-clock-history me-2"></i>
                {{ accountAge }} days on Aura
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="col-12 col-lg-8">
        <div class="row g-3">
          <!-- Task Stats -->
          <div class="col-12">
            <div class="card">
              <div class="card-header fw-semibold">
                <i class="bi bi-check2-square me-2"></i>
                Task Statistics
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-6 col-md-4">
                    <div class="text-center">
                      <h3 class="text-primary mb-0">{{ totalTasks }}</h3>
                      <small class="text-muted">Total Tasks</small>
                    </div>
                  </div>
                  <div class="col-6 col-md-4">
                    <div class="text-center">
                      <h3 class="text-success mb-0">{{ completedTasks }}</h3>
                      <small class="text-muted">Completed</small>
                    </div>
                  </div>
                  <div class="col-12 col-md-4">
                    <div class="text-center">
                      <h3 class="text-info mb-0">{{ completionRate }}%</h3>
                      <small class="text-muted">Completion Rate</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Habit Stats -->
          <div class="col-12">
            <div class="card">
              <div class="card-header fw-semibold">
                <i class="bi bi-arrow-repeat me-2"></i>
                Habit Statistics
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-4">
                    <div class="text-center">
                      <h3 class="text-primary mb-0">{{ totalHabits }}</h3>
                      <small class="text-muted">Total Habits</small>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="text-center">
                      <h3 class="text-success mb-0">{{ activeStreaks }}</h3>
                      <small class="text-muted">Active Streaks</small>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="text-center">
                      <h3 class="text-warning mb-0">{{ longestStreak }}</h3>
                      <small class="text-muted">Longest Streak</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pomodoro Stats -->
          <div class="col-12">
            <div class="card">
              <div class="card-header fw-semibold">
                <i class="bi bi-alarm me-2"></i>
                Focus Statistics (Last 30 Days)
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-4">
                    <div class="text-center">
                      <h3 class="text-primary mb-0">{{ totalFocusMinutes }}</h3>
                      <small class="text-muted">Total Minutes</small>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="text-center">
                      <h3 class="text-success mb-0">{{ totalFocusHours }}</h3>
                      <small class="text-muted">Total Hours</small>
                    </div>
                  </div>
                  <div class="col-4">
                    <div class="text-center">
                      <h3 class="text-info mb-0">{{ averageFocusPerDay }}</h3>
                      <small class="text-muted">Avg Min/Day</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
