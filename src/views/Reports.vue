<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  BarController,
  BarElement,
  Legend,
  Tooltip,
} from 'chart.js'
import { getReports } from '../api/reports.js'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  BarController,
  BarElement,
  Legend,
  Tooltip,
)

const lineCanvas = ref(null)
const barCanvas = ref(null)
let lineChart = null
let barChart = null

const reports = ref([])
const totalTasks = ref(0)
const totalFocus = ref(0)
const loading = ref(false)

async function load(range = '7d') {
  loading.value = true
  try {
    const now = new Date()
    const from = new Date()
    from.setDate(now.getDate() - (range === '30d' ? 29 : 6))
    const resp = await getReports({ from: from.toISOString(), to: now.toISOString() })
    reports.value = Array.isArray(resp) ? resp : []
    totalTasks.value = reports.value.reduce((sum, r) => sum + (r.tasksCompleted || 0), 0)
    totalFocus.value = reports.value.reduce((sum, r) => sum + (r.focusMinutes || 0), 0)

    const labels = reports.value.map((r) => r.date)
    const tasksCompleted = reports.value.map((r) => r.tasksCompleted)
    const focusMinutes = reports.value.map((r) => r.focusMinutes)

    if (lineChart) lineChart.destroy()
    if (barChart) barChart.destroy()

    lineChart = new Chart(lineCanvas.value.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Tasks Completed',
          data: tasksCompleted,
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13,110,253,0.15)',
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true }, tooltip: { enabled: true } },
      scales: { y: { beginAtZero: true } },
    },
  })

  barChart = new Chart(barCanvas.value.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Focus Minutes',
          data: focusMinutes,
          backgroundColor: 'rgba(25,135,84,0.5)',
          borderColor: '#198754',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true }, tooltip: { enabled: true } },
      scales: { y: { beginAtZero: true } },
    },
  })
  } catch (e) {
    console.error('Failed to load reports:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => load('7d'))

onBeforeUnmount(() => {
  if (lineChart) lineChart.destroy()
  if (barChart) barChart.destroy()
})
</script>

<template>
  <div class="container">
    <h2 class="mb-4">Reports</h2>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading reports...</span>
      </div>
      <p class="mt-3 text-muted">Loading your reports...</p>
    </div>

    <div v-else class="row g-3 mb-3">
      <div class="col-6 col-lg-3">
        <div class="card">
          <div class="card-body text-center">
            <div class="h5 mb-0">{{ totalTasks }}</div>
            <small class="text-secondary">Tasks completed</small>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card">
          <div class="card-body text-center">
            <div class="h5 mb-0">{{ totalFocus }}</div>
            <small class="text-secondary">Focus minutes</small>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-6 d-flex align-items-center">
        <div class="btn-group ms-auto">
          <button class="btn btn-outline-primary btn-sm" @click="load('7d')">Last 7 days</button>
          <button class="btn btn-outline-primary btn-sm" @click="load('30d')">Last 30 days</button>
        </div>
      </div>
    </div>

    <div v-if="!loading" class="row g-4">
      <div class="col-12 col-lg-6">
        <div class="card" style="height: 360px">
          <div class="card-header fw-semibold">Productivity by day (Tasks Completed)</div>
          <div class="card-body">
            <canvas ref="lineCanvas" style="width: 100%; height: 100%"></canvas>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="card" style="height: 360px">
          <div class="card-header fw-semibold">Focus minutes per week</div>
          <div class="card-body">
            <canvas ref="barCanvas" style="width: 100%; height: 100%"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
