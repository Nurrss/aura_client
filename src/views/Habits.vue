<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHabitStore } from '../stores/habitStore.js'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const habitStore = useHabitStore()
const showModal = ref(false)
const editingHabit = ref(null)

const formData = ref({
  title: '',
  frequency: 'daily',
  reminderTime: '',
})

onMounted(async () => {
  await habitStore.loadHabits()
})

const sortedHabits = computed(() => {
  return [...habitStore.habits].sort((a, b) => (b.streak || 0) - (a.streak || 0))
})

function openAddModal() {
  editingHabit.value = null
  formData.value = {
    title: '',
    frequency: 'daily',
    reminderTime: '',
  }
  showModal.value = true
}

function openEditModal(habit) {
  editingHabit.value = habit
  formData.value = {
    title: habit.title || '',
    frequency: habit.frequency || 'daily',
    reminderTime: habit.reminderTime || '',
  }
  showModal.value = true
}

async function saveHabit() {
  if (!formData.value.title.trim()) {
    alert('Title is required')
    return
  }

  const payload = {
    title: formData.value.title,
    frequency: formData.value.frequency,
    reminderTime: formData.value.reminderTime || null,
  }

  try {
    if (editingHabit.value) {
      await habitStore.updateHabit(editingHabit.value.id, payload)
    } else {
      await habitStore.createHabit(payload)
    }
    showModal.value = false
  } catch (e) {
    alert(e.message || 'Failed to save habit')
  }
}

async function checkIn(habit) {
  try {
    await habitStore.toggleHabit(habit.id)
  } catch (e) {
    alert(e.message || 'Failed to check in')
  }
}

function isCompletedToday(habit) {
  if (!habit.lastCompletedAt) return false
  const today = dayjs().format('YYYY-MM-DD')
  const lastDate = dayjs(habit.lastCompletedAt).format('YYYY-MM-DD')
  return lastDate === today
}

function getFrequencyBadge(frequency) {
  const map = {
    daily: 'bg-primary',
    weekly: 'bg-info',
    monthly: 'bg-warning text-dark',
  }
  return map[frequency] || 'bg-secondary'
}

function getFrequencyLabel(frequency) {
  const map = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  }
  return map[frequency] || frequency
}

function getStreakColor(streak) {
  if (streak >= 30) return 'text-success'
  if (streak >= 14) return 'text-info'
  if (streak >= 7) return 'text-primary'
  return 'text-muted'
}

function formatLastCompleted(date) {
  if (!date) return 'Never'
  return dayjs(date).fromNow()
}
</script>

<template>
  <div class="container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Habits</h2>
      <button class="btn btn-primary" @click="openAddModal">
        <i class="bi bi-plus-circle"></i> Add Habit
      </button>
    </div>

    <!-- Stats Summary -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card bg-primary text-white">
          <div class="card-body">
            <h6 class="card-subtitle mb-2">Total Habits</h6>
            <h3 class="card-title mb-0">{{ habitStore.habits.length }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card bg-success text-white">
          <div class="card-body">
            <h6 class="card-subtitle mb-2">Active Streaks</h6>
            <h3 class="card-title mb-0">{{ habitStore.activeHabits.length }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card bg-info text-white">
          <div class="card-body">
            <h6 class="card-subtitle mb-2">Completed Today</h6>
            <h3 class="card-title mb-0">{{ habitStore.todayCompleted.length }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="habitStore.loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="habitStore.error" class="alert alert-danger">
      {{ habitStore.error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="habitStore.habits.length === 0" class="text-center py-5 text-muted">
      <p>No habits yet</p>
      <button class="btn btn-outline-primary" @click="openAddModal">
        Create your first habit
      </button>
    </div>

    <!-- Habits Grid -->
    <div v-else class="row g-3">
      <div v-for="habit in sortedHabits" :key="habit.id" class="col-12 col-md-6 col-lg-4">
        <div class="card h-100" :class="{ 'border-success': isCompletedToday(habit) }">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <h5 class="card-title mb-0 flex-grow-1">{{ habit.title }}</h5>
              <button
                class="btn btn-sm btn-outline-primary"
                @click="openEditModal(habit)"
                title="Edit habit"
              >
                <i class="bi bi-pencil"></i>
              </button>
            </div>

            <div class="mb-3">
              <span class="badge" :class="getFrequencyBadge(habit.frequency)">
                {{ getFrequencyLabel(habit.frequency) }}
              </span>
              <span v-if="habit.reminderTime" class="badge bg-light text-dark ms-2">
                <i class="bi bi-bell"></i> {{ habit.reminderTime }}
              </span>
            </div>

            <!-- Streak Display -->
            <div class="text-center mb-3 py-3 bg-light rounded">
              <div class="display-4 mb-1" :class="getStreakColor(habit.streak)">
                <i class="bi bi-fire"></i>
                {{ habit.streak }}
              </div>
              <small class="text-muted">Day Streak</small>
            </div>

            <div class="mb-3 text-muted small">
              <i class="bi bi-clock-history"></i>
              Last completed: {{ formatLastCompleted(habit.lastCompletedAt) }}
            </div>

            <!-- Check-in Button -->
            <button
              class="btn w-100"
              :class="
                isCompletedToday(habit)
                  ? 'btn-success disabled'
                  : 'btn-outline-success'
              "
              @click="checkIn(habit)"
              :disabled="isCompletedToday(habit)"
            >
              <i
                class="bi"
                :class="isCompletedToday(habit) ? 'bi-check-circle-fill' : 'bi-check-circle'"
              ></i>
              {{ isCompletedToday(habit) ? 'Completed Today!' : 'Check In' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div
      v-if="showModal"
      class="modal d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingHabit ? 'Edit Habit' : 'Add New Habit' }}</h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Title *</label>
              <input type="text" class="form-control" v-model="formData.title" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Frequency</label>
              <select class="form-select" v-model="formData.frequency">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Reminder Time (optional)</label>
              <input
                type="time"
                class="form-control"
                v-model="formData.reminderTime"
                placeholder="HH:MM"
              />
              <div class="form-text">Set a time to receive reminders for this habit</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showModal = false">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" @click="saveHabit">Save Habit</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  display: block;
}

.card.border-success {
  border-width: 2px;
}
</style>
