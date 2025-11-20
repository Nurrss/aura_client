<script setup>
import { onMounted, ref, computed } from 'vue'
import { useTaskStore } from '../stores/taskStore.js'
import { useHabitStore } from '../stores/habitStore.js'
import { getTodayReport } from '../api/reports.js'
import dayjs from 'dayjs'

const taskStore = useTaskStore()
const habitStore = useHabitStore()
const reportData = ref(null)
const loading = ref(true)

const tasksToday = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return taskStore.tasks.filter((t) => {
    if (!t.startTime) return false
    const taskDate = dayjs(t.startTime).format('YYYY-MM-DD')
    return taskDate === today
  }).slice(0, 5) // Show max 5 tasks
})

const topHabits = computed(() => {
  return habitStore.habits.slice(0, 5) // Show max 5 habits
})

const reportToday = computed(() => {
  return reportData.value || {
    tasksCompleted: 0,
    focusMinutes: 0,
    habitsDone: 0,
  }
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      taskStore.loadTasks(),
      habitStore.loadHabits(),
      loadReport(),
    ])
  } catch (e) {
    console.error('Failed to load dashboard data:', e)
  } finally {
    loading.value = false
  }
})

async function loadReport() {
  try {
    reportData.value = await getTodayReport()
  } catch (e) {
    console.error('Failed to load report:', e)
  }
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return dayjs(dateStr).format('h:mm A')
}

function getStatusBadge(status) {
  if (status === 'completed') return 'bg-success'
  if (status === 'in_progress') return 'bg-info'
  return 'bg-warning'
}
</script>

<template>
  <div class="container">
    <h2 class="mb-4">Dashboard</h2>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else class="row g-4">
      <!-- Productivity Summary (moved to top) -->
      <div class="col-12">
        <div class="card">
          <div class="card-header fw-semibold">Today's Productivity</div>
          <div class="card-body">
            <div class="row text-center">
              <div class="col-6 col-md-3">
                <div class="display-6 mb-2">{{ reportToday.tasksCompleted }}</div>
                <small class="text-muted">Tasks Completed</small>
              </div>
              <div class="col-6 col-md-3">
                <div class="display-6 mb-2">{{ reportToday.tasksPending || 0 }}</div>
                <small class="text-muted">Tasks Pending</small>
              </div>
              <div class="col-6 col-md-3">
                <div class="display-6 mb-2">{{ reportToday.focusMinutes }}</div>
                <small class="text-muted">Focus Minutes</small>
              </div>
              <div class="col-6 col-md-3">
                <div class="display-6 mb-2">{{ reportToday.habitsDone }}</div>
                <small class="text-muted">Habits Done</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks for Today -->
      <div class="col-12 col-lg-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span class="fw-semibold">Tasks for Today</span>
            <router-link to="/tasks" class="btn btn-sm btn-outline-primary">View All</router-link>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li
                v-for="task in tasksToday"
                :key="task.id"
                class="list-group-item d-flex justify-content-between align-items-start px-0"
              >
                <div class="flex-grow-1">
                  <div class="fw-semibold">{{ task.title }}</div>
                  <small class="text-muted">
                    <i class="bi bi-clock"></i>
                    {{ formatTime(task.startTime) }}
                    <span v-if="task.endTime"> – {{ formatTime(task.endTime) }}</span>
                  </small>
                </div>
                <span class="badge" :class="getStatusBadge(task.status)">
                  {{ task.status }}
                </span>
              </li>
              <li v-if="tasksToday.length === 0" class="list-group-item text-muted px-0">
                No tasks scheduled for today.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Habits -->
      <div class="col-12 col-lg-6">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span class="fw-semibold">Your Habits</span>
            <router-link to="/habits" class="btn btn-sm btn-outline-primary">View All</router-link>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li
                v-for="h in topHabits"
                :key="h.id"
                class="list-group-item d-flex justify-content-between align-items-center px-0"
              >
                <div>
                  <div class="fw-semibold">{{ h.title }}</div>
                  <small class="text-muted">{{ h.frequency }}</small>
                </div>
                <span class="badge rounded-pill bg-primary">
                  <i class="bi bi-fire"></i> {{ h.streak }}
                </span>
              </li>
              <li v-if="topHabits.length === 0" class="list-group-item text-muted px-0">
                No habits yet. Start building good habits!
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="col-12">
        <div class="card">
          <div class="card-header fw-semibold">Quick Actions</div>
          <div class="card-body">
            <div class="d-flex gap-2 flex-wrap">
              <router-link to="/tasks" class="btn btn-primary">
                <i class="bi bi-plus-circle"></i> Add Task
              </router-link>
              <router-link to="/habits" class="btn btn-success">
                <i class="bi bi-plus-circle"></i> Add Habit
              </router-link>
              <router-link to="/pomodoro" class="btn btn-danger">
                <i class="bi bi-play-circle"></i> Start Pomodoro
              </router-link>
              <router-link to="/reports" class="btn btn-info">
                <i class="bi bi-graph-up"></i> View Reports
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
