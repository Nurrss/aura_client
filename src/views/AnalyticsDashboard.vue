<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAnalyticsStore } from '../stores/analyticsStore.js'
import { useRoadmapStore } from '../stores/roadmapStore.js'

const analyticsStore = useAnalyticsStore()
const roadmapStore = useRoadmapStore()

const selectedPeriod = ref(30)
const showCoaching = ref(false)

onMounted(async () => {
  await analyticsStore.loadDashboard()
  await roadmapStore.loadRoadmaps()
})

async function refreshDashboard() {
  await analyticsStore.refreshAll()
}

async function generateCoaching() {
  await analyticsStore.generateWeeklyCoaching()
  showCoaching.value = true
}

function getCategoryIcon(category) {
  const icons = {
    career: '💼',
    health: '💪',
    finance: '💰',
    learning: '📚',
    relationships: '❤️',
    personal: '🌟',
  }
  return icons[category] || '📌'
}

function getProgressBarClass(percentage) {
  if (percentage >= 70) return 'bg-success'
  if (percentage >= 40) return 'bg-warning'
  return 'bg-danger'
}

function getTrendIcon(trend) {
  if (trend === 'increasing') return '📈'
  if (trend === 'decreasing') return '📉'
  return '➡️'
}

function getSeverityBadge(severity) {
  const badges = {
    high: 'danger',
    medium: 'warning',
    low: 'info',
    none: 'secondary',
  }
  return badges[severity] || 'secondary'
}

const streakMessage = computed(() => {
  const streak = analyticsStore.streak
  if (!streak) return ''

  if (streak.currentStreak >= 30) return 'Incredible! A month-long streak! 🔥'
  if (streak.currentStreak >= 14) return 'Amazing consistency! Keep it up! 🌟'
  if (streak.currentStreak >= 7) return 'One week strong! 💪'
  if (streak.currentStreak >= 3) return 'Building momentum! 🚀'
  if (streak.currentStreak >= 1) return 'Good start! 👍'
  return 'Start your streak today! 💡'
})
</script>

<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2>Analytics Dashboard</h2>
        <p class="text-muted mb-0">Track your progress and get AI-powered insights</p>
      </div>
      <div class="btn-group">
        <button
          class="btn btn-outline-primary"
          @click="refreshDashboard"
          :disabled="analyticsStore.loadingDashboard"
        >
          <i class="bi bi-arrow-clockwise me-1"></i>
          Refresh
        </button>
        <button class="btn btn-primary" @click="generateCoaching">
          <i class="bi bi-stars me-1"></i>
          AI Coaching
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="analyticsStore.loadingDashboard" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading analytics...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Overview Cards -->
      <div class="row g-3 mb-4">
        <!-- Velocity Card -->
        <div class="col-md-6 col-lg-3">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted">Velocity Trend</h6>
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <h3 class="mb-0">
                    {{ getTrendIcon(analyticsStore.velocity?.trend) }}
                    {{ analyticsStore.velocity?.trend || 'N/A' }}
                  </h3>
                  <small class="text-muted">
                    {{ analyticsStore.velocity?.averages?.tasksPerWeek?.toFixed(1) || '0' }} tasks/week
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Streak Card -->
        <div class="col-md-6 col-lg-3">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted">Current Streak</h6>
              <h3 class="mb-0">
                🔥 {{ analyticsStore.streak?.currentStreak || 0 }} days
              </h3>
              <small class="text-muted">
                Longest: {{ analyticsStore.streak?.longestStreak || 0 }} days
              </small>
              <div class="mt-2">
                <small class="badge bg-info">{{ streakMessage }}</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottlenecks Card -->
        <div class="col-md-6 col-lg-3">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted">Bottlenecks</h6>
              <h3 class="mb-0">
                {{ analyticsStore.bottlenecks?.summary?.totalOverdue || 0 }}
              </h3>
              <small class="text-muted">Overdue milestones</small>
              <div class="mt-2">
                <span
                  class="badge"
                  :class="`bg-${getSeverityBadge(analyticsStore.bottlenecks?.summary?.severity)}`"
                >
                  {{ analyticsStore.bottlenecks?.summary?.severity || 'none' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Roadmaps Card -->
        <div class="col-md-6 col-lg-3">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="card-subtitle mb-2 text-muted">Roadmaps</h6>
              <h3 class="mb-0">{{ analyticsStore.overview?.activeRoadmaps || 0 }}</h3>
              <small class="text-muted">
                Active ({{ analyticsStore.overview?.totalRoadmaps || 0 }} total)
              </small>
            </div>
          </div>
        </div>
      </div>

      <!-- Velocity Chart -->
      <div class="row g-3 mb-4" v-if="analyticsStore.velocity">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Weekly Performance</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Tasks</th>
                      <th>Milestones</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(week, idx) in analyticsStore.velocity.weeklyBreakdown?.slice(0, 4)"
                      :key="idx"
                    >
                      <td>{{ new Date(week.weekStart).toLocaleDateString() }}</td>
                      <td>{{ week.tasksCompleted }}</td>
                      <td>{{ week.milestonesCompleted }}</td>
                      <td>{{ week.totalHours.toFixed(1) }}h</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Category Distribution -->
        <div class="col-lg-4">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="mb-0">Category Focus</h5>
            </div>
            <div class="card-body">
              <div
                v-for="cat in analyticsStore.categoryDistribution?.distribution?.slice(0, 6)"
                :key="cat.category"
                class="mb-3"
              >
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <small>
                    {{ getCategoryIcon(cat.category) }}
                    <strong>{{ cat.category }}</strong>
                  </small>
                  <small class="text-muted">{{ cat.completionRate }}%</small>
                </div>
                <div class="progress" style="height: 8px">
                  <div
                    class="progress-bar"
                    :class="getProgressBarClass(cat.completionRate)"
                    :style="{ width: cat.completionRate + '%' }"
                  ></div>
                </div>
                <small class="text-muted">{{ cat.goalsCount }} goals</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Predictions -->
      <div class="row g-3 mb-4" v-if="analyticsStore.predictions?.length">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Roadmap Predictions</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div
                  v-for="pred in analyticsStore.predictions"
                  :key="pred.roadmapId"
                  class="col-md-6 mb-3"
                >
                  <div class="border rounded p-3">
                    <h6>{{ pred.roadmapTitle }}</h6>
                    <div class="mb-2">
                      <small class="text-muted">Predicted completion:</small><br />
                      <strong>
                        {{
                          pred.prediction.predictedCompletionDate
                            ? new Date(pred.prediction.predictedCompletionDate).toLocaleDateString()
                            : 'Not enough data'
                        }}
                      </strong>
                      <span
                        v-if="pred.prediction.onTrack !== undefined"
                        class="badge ms-2"
                        :class="pred.prediction.onTrack ? 'bg-success' : 'bg-warning'"
                      >
                        {{ pred.prediction.onTrack ? 'On Track' : 'Behind Schedule' }}
                      </span>
                    </div>
                    <small class="text-muted">
                      Confidence: {{ pred.prediction.confidence }} •
                      {{ pred.prediction.estimatedWeeks?.toFixed(1) }} weeks remaining
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottlenecks Details -->
      <div class="row g-3 mb-4" v-if="analyticsStore.bottlenecks?.overdueMilestones?.length">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Action Required</h5>
            </div>
            <div class="card-body">
              <h6>Overdue Milestones</h6>
              <div class="list-group list-group-flush">
                <div
                  v-for="milestone in analyticsStore.bottlenecks.overdueMilestones.slice(0, 5)"
                  :key="milestone.milestoneId"
                  class="list-group-item"
                >
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 class="mb-1">{{ milestone.milestoneTitle }}</h6>
                      <small class="text-muted">
                        {{ getCategoryIcon(milestone.category) }} {{ milestone.goalTitle }}
                      </small>
                    </div>
                    <span class="badge bg-danger">{{ milestone.daysOverdue }} days overdue</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Coaching Modal/Section -->
      <div v-if="showCoaching && analyticsStore.weeklyCoaching" class="row g-3 mb-4">
        <div class="col-12">
          <div class="card border-primary">
            <div class="card-header bg-primary text-white">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                  <i class="bi bi-stars me-2"></i>
                  AI Weekly Coaching
                </h5>
                <button class="btn btn-sm btn-light" @click="showCoaching = false">
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>
            <div class="card-body">
              <!-- Progress Highlights -->
              <div class="mb-4" v-if="analyticsStore.weeklyCoaching.highlights">
                <h6 class="text-primary">Progress Highlights</h6>
                <p>{{ analyticsStore.weeklyCoaching.highlights }}</p>
              </div>

              <!-- Key Insights -->
              <div class="mb-4" v-if="analyticsStore.weeklyCoaching.insights?.length">
                <h6 class="text-primary">Key Insights</h6>
                <ul>
                  <li v-for="(insight, idx) in analyticsStore.weeklyCoaching.insights" :key="idx">
                    {{ insight }}
                  </li>
                </ul>
              </div>

              <!-- Recommendations -->
              <div class="mb-4" v-if="analyticsStore.weeklyCoaching.recommendations?.length">
                <h6 class="text-primary">This Week's Focus</h6>
                <ol>
                  <li
                    v-for="(rec, idx) in analyticsStore.weeklyCoaching.recommendations"
                    :key="idx"
                  >
                    {{ rec }}
                  </li>
                </ol>
              </div>

              <!-- Motivation -->
              <div v-if="analyticsStore.weeklyCoaching.motivation" class="alert alert-info">
                <strong>💪 {{ analyticsStore.weeklyCoaching.motivation }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="
          !analyticsStore.velocity ||
          analyticsStore.velocity.totals.tasksCompleted === 0
        "
        class="text-center py-5"
      >
        <i class="bi bi-graph-up" style="font-size: 4rem; color: #ccc"></i>
        <h4 class="mt-3">No Analytics Data Yet</h4>
        <p class="text-muted">
          Complete some tasks and milestones to see your analytics dashboard.
        </p>
        <RouterLink to="/roadmap" class="btn btn-primary">
          Go to Roadmaps
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-2px);
}

.progress {
  border-radius: 0.25rem;
}
</style>
