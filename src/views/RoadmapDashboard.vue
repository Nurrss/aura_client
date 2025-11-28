<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoadmapStore } from '../stores/roadmapStore.js'
import { useUiStore } from '../stores/uiStore.js'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const router = useRouter()
const roadmapStore = useRoadmapStore()
const uiStore = useUiStore()

const currentFilter = ref('all')
const showDeleteConfirm = ref(false)
const roadmapToDelete = ref(null)

onMounted(async () => {
  await roadmapStore.loadRoadmaps()
})

const filteredRoadmaps = computed(() => {
  if (currentFilter.value === 'all') return roadmapStore.roadmaps
  return roadmapStore.roadmaps.filter((r) => r.status === currentFilter.value)
})

const roadmapsByStatus = computed(() => ({
  all: roadmapStore.roadmaps.length,
  draft: roadmapStore.roadmaps.filter((r) => r.status === 'draft').length,
  active: roadmapStore.roadmaps.filter((r) => r.status === 'active').length,
  completed: roadmapStore.roadmaps.filter((r) => r.status === 'completed').length,
  paused: roadmapStore.roadmaps.filter((r) => r.status === 'paused').length,
}))

function getStatusBadgeClass(status) {
  const classes = {
    draft: 'bg-secondary',
    active: 'bg-primary',
    paused: 'bg-warning',
    completed: 'bg-success',
    archived: 'bg-dark',
  }
  return classes[status] || 'bg-secondary'
}

function getStatusIcon(status) {
  const icons = {
    draft: 'bi-file-earmark',
    active: 'bi-play-circle',
    paused: 'bi-pause-circle',
    completed: 'bi-check-circle',
    archived: 'bi-archive',
  }
  return icons[status] || 'bi-file-earmark'
}

function viewRoadmap(id) {
  router.push(`/roadmap/${id}`)
}

function createNew() {
  router.push('/roadmap/create')
}

function confirmDelete(roadmap) {
  roadmapToDelete.value = roadmap
  showDeleteConfirm.value = true
}

async function deleteRoadmap() {
  try {
    await roadmapStore.deleteRoadmap(roadmapToDelete.value.id)
    uiStore.showToast('Roadmap deleted successfully', 'success')
    showDeleteConfirm.value = false
    roadmapToDelete.value = null
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to delete roadmap', 'danger')
  }
}

async function changeStatus(id, newStatus) {
  try {
    await roadmapStore.updateRoadmap(id, { status: newStatus })
    uiStore.showToast(`Roadmap status updated to ${newStatus}`, 'success')
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to update status', 'danger')
  }
}

function getProgressColor(percentage) {
  if (percentage < 25) return 'bg-danger'
  if (percentage < 50) return 'bg-warning'
  if (percentage < 75) return 'bg-info'
  return 'bg-success'
}

function formatDate(date) {
  if (!date) return 'N/A'
  return dayjs(date).format('MMM D, YYYY')
}

function getTimeRemaining(endDate) {
  if (!endDate) return 'No end date'
  const now = dayjs()
  const end = dayjs(endDate)

  if (end.isBefore(now)) {
    return 'Overdue'
  }

  return end.fromNow()
}
</script>

<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2>🗺️ My Roadmaps</h2>
        <p class="text-muted">Track your 5-year journey to success</p>
      </div>
      <button @click="createNew" class="btn btn-primary">
        <i class="bi bi-plus-circle"></i> Create New Roadmap
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="row mb-4">
      <div class="col-md-3 col-6 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h3 class="mb-0">{{ roadmapsByStatus.all }}</h3>
            <small class="text-muted">Total Roadmaps</small>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-6 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h3 class="mb-0 text-primary">{{ roadmapsByStatus.active }}</h3>
            <small class="text-muted">Active</small>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-6 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h3 class="mb-0 text-success">{{ roadmapsByStatus.completed }}</h3>
            <small class="text-muted">Completed</small>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-6 mb-3">
        <div class="card text-center">
          <div class="card-body">
            <h3 class="mb-0 text-secondary">{{ roadmapsByStatus.draft }}</h3>
            <small class="text-muted">Draft</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: currentFilter === 'all' }"
          href="#"
          @click.prevent="currentFilter = 'all'"
        >
          All ({{ roadmapsByStatus.all }})
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: currentFilter === 'active' }"
          href="#"
          @click.prevent="currentFilter = 'active'"
        >
          Active ({{ roadmapsByStatus.active }})
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: currentFilter === 'draft' }"
          href="#"
          @click.prevent="currentFilter = 'draft'"
        >
          Draft ({{ roadmapsByStatus.draft }})
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: currentFilter === 'completed' }"
          href="#"
          @click.prevent="currentFilter = 'completed'"
        >
          Completed ({{ roadmapsByStatus.completed }})
        </a>
      </li>
    </ul>

    <!-- Loading State -->
    <div v-if="roadmapStore.loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredRoadmaps.length === 0" class="text-center py-5">
      <div class="mb-4">
        <i class="bi bi-map" style="font-size: 4rem; color: #ccc;"></i>
      </div>
      <h4>No Roadmaps Yet</h4>
      <p class="text-muted mb-4">
        {{ currentFilter === 'all' ? 'Create your first 5-year roadmap to get started!' : `No ${currentFilter} roadmaps found.` }}
      </p>
      <button @click="createNew" class="btn btn-primary">
        <i class="bi bi-plus-circle"></i> Create Your First Roadmap
      </button>
    </div>

    <!-- Roadmaps Grid -->
    <div v-else class="row">
      <div
        v-for="roadmap in filteredRoadmaps"
        :key="roadmap.id"
        class="col-md-6 col-lg-4 mb-4"
      >
        <div class="card h-100 roadmap-card" @click="viewRoadmap(roadmap.id)">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <h5 class="card-title mb-0">{{ roadmap.title }}</h5>
              <span class="badge" :class="getStatusBadgeClass(roadmap.status)">
                <i :class="getStatusIcon(roadmap.status)"></i>
                {{ roadmap.status }}
              </span>
            </div>

            <p v-if="roadmap.visionStatement" class="card-text text-muted small">
              {{ roadmap.visionStatement.substring(0, 100) }}{{ roadmap.visionStatement.length > 100 ? '...' : '' }}
            </p>

            <!-- Progress Bar -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <small class="text-muted">Overall Progress</small>
                <small class="fw-bold">{{ Number(roadmap.progressPercentage || 0).toFixed(0) }}%</small>
              </div>
              <div class="progress" style="height: 8px;">
                <div
                  class="progress-bar"
                  :class="getProgressColor(Number(roadmap.progressPercentage || 0))"
                  :style="{ width: `${roadmap.progressPercentage || 0}%` }"
                  role="progressbar"
                ></div>
              </div>
            </div>

            <!-- Meta Info -->
            <div class="mb-2">
              <small class="text-muted">
                <i class="bi bi-calendar-event"></i>
                {{ formatDate(roadmap.startDate) }} - {{ formatDate(roadmap.endDate) }}
              </small>
            </div>

            <div class="mb-3">
              <small class="text-muted">
                <i class="bi bi-clock"></i>
                {{ getTimeRemaining(roadmap.endDate) }}
              </small>
            </div>

            <!-- Generation Method Badge -->
            <div v-if="roadmap.generationMethod" class="mb-3">
              <span
                class="badge"
                :class="roadmap.generationMethod === 'llm_assisted' ? 'bg-info' : 'bg-secondary'"
              >
                {{ roadmap.generationMethod === 'llm_assisted' ? '🤖 AI-Generated' : '✏️ Manual' }}
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex gap-2">
              <button
                @click.stop="viewRoadmap(roadmap.id)"
                class="btn btn-sm btn-primary flex-grow-1"
              >
                <i class="bi bi-eye"></i> View
              </button>

              <div class="btn-group" @click.stop>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu">
                  <li v-if="roadmap.status === 'draft'">
                    <a
                      class="dropdown-item"
                      href="#"
                      @click.prevent="changeStatus(roadmap.id, 'active')"
                    >
                      <i class="bi bi-play-circle text-primary"></i> Activate
                    </a>
                  </li>
                  <li v-if="roadmap.status === 'active'">
                    <a
                      class="dropdown-item"
                      href="#"
                      @click.prevent="changeStatus(roadmap.id, 'paused')"
                    >
                      <i class="bi bi-pause-circle text-warning"></i> Pause
                    </a>
                  </li>
                  <li v-if="roadmap.status === 'paused'">
                    <a
                      class="dropdown-item"
                      href="#"
                      @click.prevent="changeStatus(roadmap.id, 'active')"
                    >
                      <i class="bi bi-play-circle text-primary"></i> Resume
                    </a>
                  </li>
                  <li v-if="roadmap.status !== 'completed'">
                    <a
                      class="dropdown-item"
                      href="#"
                      @click.prevent="changeStatus(roadmap.id, 'completed')"
                    >
                      <i class="bi bi-check-circle text-success"></i> Mark Complete
                    </a>
                  </li>
                  <li><hr class="dropdown-divider" /></li>
                  <li>
                    <a
                      class="dropdown-item text-danger"
                      href="#"
                      @click.prevent="confirmDelete(roadmap)"
                    >
                      <i class="bi bi-trash"></i> Delete
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0,0,0,0.5);"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Delete</h5>
            <button
              type="button"
              class="btn-close"
              @click="showDeleteConfirm = false"
            ></button>
          </div>
          <div class="modal-body">
            <p>
              Are you sure you want to delete
              <strong>{{ roadmapToDelete?.title }}</strong>?
            </p>
            <p class="text-danger">
              <i class="bi bi-exclamation-triangle"></i>
              This will permanently delete the roadmap and all its goals, milestones, and tasks.
            </p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </button>
            <button type="button" class="btn btn-danger" @click="deleteRoadmap">
              Delete Roadmap
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.roadmap-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.roadmap-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-title {
  line-height: 1.2;
  max-height: 2.4em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
