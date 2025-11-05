<script setup>
import { onMounted, ref, computed } from 'vue'

const tasks = ref([])
const habits = ref([])
const reports = ref([])

const todayIso = new Date().toISOString().slice(0, 10)

const tasksToday = computed(() => tasks.value.filter((t) => t.date === todayIso))
const reportToday = computed(
  () =>
    reports.value.find((r) => r.date === todayIso) || {
      tasksCompleted: 0,
      focusMinutes: 0,
      habitsDone: 0,
    },
)

onMounted(async () => {
  const [tasksRes, habitsRes, reportsRes] = await Promise.all([
    fetch(new URL('../data/tasks.json', import.meta.url)),
    fetch(new URL('../data/habits.json', import.meta.url)),
    fetch(new URL('../data/reports.json', import.meta.url)),
  ])
  tasks.value = await tasksRes.json()
  habits.value = await habitsRes.json()
  reports.value = await reportsRes.json()
})
</script>

<template>
  <div class="container">
    <h2 class="mb-4">Dashboard</h2>
    <div class="row g-4">
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-header fw-semibold">Tasks for Today</div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li
                v-for="task in tasksToday"
                :key="task.id"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <div class="fw-semibold">{{ task.title }}</div>
                  <small class="text-secondary">{{ task.startTime }} – {{ task.endTime }}</small>
                </div>
                <span v-if="task.status === 'done'" class="badge bg-success">✓</span>
              </li>
              <li v-if="tasksToday.length === 0" class="list-group-item text-secondary">
                No tasks scheduled for today.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-header fw-semibold">Habits</div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li
                v-for="h in habits"
                :key="h.id"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <div class="fw-semibold">{{ h.title }}</div>
                  <small class="text-secondary">Reminder: {{ h.reminderTime }}</small>
                </div>
                <span class="badge rounded-pill bg-primary">🔥 {{ h.streak }}</span>
              </li>
              <li v-if="habits.length === 0" class="list-group-item text-secondary">
                No habits yet.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-header fw-semibold">Productivity Summary</div>
          <div class="card-body">
            <div class="row text-center">
              <div class="col-4">
                <div class="h4 mb-0">{{ reportToday.tasksCompleted }}</div>
                <small class="text-secondary">Tasks</small>
              </div>
              <div class="col-4">
                <div class="h4 mb-0">{{ reportToday.focusMinutes }}</div>
                <small class="text-secondary">Focus (min)</small>
              </div>
              <div class="col-4">
                <div class="h4 mb-0">{{ reportToday.habitsDone }}</div>
                <small class="text-secondary">Habits</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
