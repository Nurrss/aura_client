<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoadmapStore } from '../stores/roadmapStore.js'
import { useUiStore } from '../stores/uiStore.js'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const roadmapStore = useRoadmapStore()
const uiStore = useUiStore()

const roadmapId = computed(() => parseInt(route.params.id))
const activeTab = ref('overview')
const showGoalModal = ref(false)
const showMilestoneModal = ref(false)
const editingGoal = ref(null)
const editingMilestone = ref(null)
const selectedGoalId = ref(null)

const goalForm = ref({
  category: 'career',
  title: '',
  description: '',
  priority: 3,
  timeframe: 'year_1',
  targetYear: 1,
  successCriteria: '',
})

const milestoneForm = ref({
  title: '',
  description: '',
  dueDate: '',
  estimatedEffortHours: 10,
})

onMounted(async () => {
  await loadRoadmapData()
})

async function loadRoadmapData() {
  try {
    await roadmapStore.loadRoadmapById(roadmapId.value, { includeGoals: true })
  } catch (error) {
    uiStore.showToast('Failed to load roadmap', 'danger')
    router.push('/roadmap')
  }
}

const roadmap = computed(() => roadmapStore.currentRoadmap)
const goals = computed(() => roadmapStore.currentGoals)
const milestones = computed(() => roadmapStore.currentMilestones)

const categories = [
  { value: 'career', label: 'Career', icon: '💼' },
  { value: 'health', label: 'Health', icon: '💪' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'relationships', label: 'Relationships', icon: '❤️' },
  { value: 'learning', label: 'Learning', icon: '📚' },
  { value: 'personal', label: 'Personal', icon: '🌟' },
  { value: 'other', label: 'Other', icon: '📌' },
]

function getCategoryIcon(categoryValue) {
  return categories.find(c => c.value === categoryValue)?.icon || '📌'
}

function getStatusBadgeClass(status) {
  const classes = {
    not_started: 'bg-secondary',
    in_progress: 'bg-primary',
    completed: 'bg-success',
    blocked: 'bg-danger',
    abandoned: 'bg-dark',
    overdue: 'bg-warning',
    skipped: 'bg-secondary',
  }
  return classes[status] || 'bg-secondary'
}

function openAddGoalModal() {
  editingGoal.value = null
  goalForm.value = {
    category: 'career',
    title: '',
    description: '',
    priority: 3,
    timeframe: 'year_1',
    targetYear: 1,
    successCriteria: '',
  }
  showGoalModal.value = true
}

async function saveGoal() {
  try {
    if (editingGoal.value) {
      await roadmapStore.updateGoal(editingGoal.value.id, goalForm.value)
      uiStore.showToast('Goal updated successfully', 'success')
    } else {
      await roadmapStore.createGoal(roadmapId.value, goalForm.value)
      uiStore.showToast('Goal created successfully', 'success')
    }
    showGoalModal.value = false
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to save goal', 'danger')
  }
}

async function deleteGoal(goalId) {
  if (!confirm('Are you sure you want to delete this goal?')) return

  try {
    await roadmapStore.deleteGoal(goalId)
    uiStore.showToast('Goal deleted successfully', 'success')
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to delete goal', 'danger')
  }
}

async function viewGoalMilestones(goalId) {
  selectedGoalId.value = goalId
  activeTab.value = 'milestones'
  await roadmapStore.loadMilestones(goalId)
}

function openAddMilestoneModal(goalId) {
  selectedGoalId.value = goalId
  editingMilestone.value = null
  milestoneForm.value = {
    title: '',
    description: '',
    dueDate: '',
    estimatedEffortHours: 10,
  }
  showMilestoneModal.value = true
}

async function saveMilestone() {
  try {
    if (editingMilestone.value) {
      await roadmapStore.updateMilestone(editingMilestone.value.id, {
        ...milestoneForm.value,
        dueDate: dayjs(milestoneForm.value.dueDate).toISOString(),
      })
      uiStore.showToast('Milestone updated successfully', 'success')
    } else {
      await roadmapStore.createMilestone(selectedGoalId.value, {
        ...milestoneForm.value,
        dueDate: dayjs(milestoneForm.value.dueDate).toISOString(),
      })
      uiStore.showToast('Milestone created successfully', 'success')
    }
    showMilestoneModal.value = false
    await roadmapStore.loadMilestones(selectedGoalId.value)
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to save milestone', 'danger')
  }
}

async function completeMilestone(milestoneId) {
  try {
    await roadmapStore.completeMilestone(milestoneId)
    uiStore.showToast('Milestone completed!', 'success')
    await roadmapStore.loadMilestones(selectedGoalId.value)
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to complete milestone', 'danger')
  }
}

async function deleteMilestone(milestoneId) {
  if (!confirm('Are you sure you want to delete this milestone?')) return

  try {
    await roadmapStore.deleteMilestone(milestoneId)
    uiStore.showToast('Milestone deleted successfully', 'success')
    await roadmapStore.loadMilestones(selectedGoalId.value)
  } catch (error) {
    uiStore.showToast(error.message || 'Failed to delete milestone', 'danger')
  }
}

function formatDate(date) {
  return dayjs(date).format('MMM D, YYYY')
}

function getProgressColor(percentage) {
  if (percentage < 25) return 'bg-danger'
  if (percentage < 50) return 'bg-warning'
  if (percentage < 75) return 'bg-info'
  return 'bg-success'
}
</script>

<template>
  <div v-if="roadmap" class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-start mb-4">
      <div>
        <button @click="router.push('/roadmap')" class="btn btn-sm btn-outline-secondary mb-2">
          <i class="bi bi-arrow-left"></i> Back to Roadmaps
        </button>
        <h2>{{ roadmap.title }}</h2>
        <p v-if="roadmap.visionStatement" class="text-muted">{{ roadmap.visionStatement }}</p>
      </div>
      <span class="badge" :class="getStatusBadgeClass(roadmap.status)" style="font-size: 1rem; padding: 0.5rem 1rem;">
        {{ roadmap.status }}
      </span>
    </div>

    <!-- Progress Overview -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row">
          <div class="col-md-8">
            <h5>Overall Progress</h5>
            <div class="progress mb-2" style="height: 30px;">
              <div
                class="progress-bar"
                :class="getProgressColor(Number(roadmap.progressPercentage || 0))"
                :style="{ width: `${roadmap.progressPercentage || 0}%` }"
                role="progressbar"
              >
                <strong>{{ Number(roadmap.progressPercentage || 0).toFixed(1) }}%</strong>
              </div>
            </div>
            <div class="d-flex justify-content-between text-muted small">
              <span><i class="bi bi-calendar-event"></i> {{ formatDate(roadmap.startDate) }}</span>
              <span><i class="bi bi-calendar-check"></i> {{ formatDate(roadmap.endDate) }}</span>
            </div>
          </div>
          <div class="col-md-4">
            <div class="row text-center">
              <div class="col-6 mb-2">
                <h4 class="mb-0">{{ roadmapStore.totalGoalsCount }}</h4>
                <small class="text-muted">Total Goals</small>
              </div>
              <div class="col-6 mb-2">
                <h4 class="mb-0 text-success">{{ roadmapStore.completedGoalsCount }}</h4>
                <small class="text-muted">Completed</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'overview' }"
          href="#"
          @click.prevent="activeTab = 'overview'"
        >
          <i class="bi bi-list-check"></i> Goals Overview
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'milestones' }"
          href="#"
          @click.prevent="activeTab = 'milestones'"
        >
          <i class="bi bi-flag"></i> Milestones
        </a>
      </li>
    </ul>

    <!-- Overview Tab -->
    <div v-if="activeTab === 'overview'">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4>Goals</h4>
        <button @click="openAddGoalModal" class="btn btn-primary">
          <i class="bi bi-plus-circle"></i> Add Goal
        </button>
      </div>

      <div v-if="goals.length === 0" class="text-center py-5">
        <i class="bi bi-trophy" style="font-size: 3rem; color: #ccc;"></i>
        <h5 class="mt-3">No Goals Yet</h5>
        <p class="text-muted">Add your first goal to get started!</p>
      </div>

      <div v-else class="row">
        <div
          v-for="goal in goals"
          :key="goal.id"
          class="col-md-6 mb-3"
        >
          <div class="card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="d-flex align-items-center gap-2">
                  <span class="fs-4">{{ getCategoryIcon(goal.category) }}</span>
                  <h5 class="mb-0">{{ goal.title }}</h5>
                </div>
                <span class="badge" :class="getStatusBadgeClass(goal.status)">
                  {{ goal.status.replace('_', ' ') }}
                </span>
              </div>

              <p v-if="goal.description" class="card-text text-muted small">{{ goal.description }}</p>

              <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                  <small class="text-muted">Progress</small>
                  <small class="fw-bold">{{ Number(goal.completionPercentage || 0).toFixed(0) }}%</small>
                </div>
                <div class="progress" style="height: 6px;">
                  <div
                    class="progress-bar"
                    :class="getProgressColor(Number(goal.completionPercentage || 0))"
                    :style="{ width: `${goal.completionPercentage || 0}%` }"
                  ></div>
                </div>
              </div>

              <div class="mb-3">
                <small class="text-muted">
                  <i class="bi bi-calendar"></i> Target Year {{ goal.targetYear }}
                </small>
                <span class="mx-2">•</span>
                <small class="text-muted">
                  <i class="bi bi-exclamation-circle"></i> Priority {{ goal.priority }}
                </small>
              </div>

              <div class="d-flex gap-2">
                <button
                  @click="viewGoalMilestones(goal.id)"
                  class="btn btn-sm btn-outline-primary flex-grow-1"
                >
                  <i class="bi bi-flag"></i> Milestones
                </button>
                <button @click="deleteGoal(goal.id)" class="btn btn-sm btn-outline-danger">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Milestones Tab -->
    <div v-if="activeTab === 'milestones'">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4>Milestones</h4>
        <button
          v-if="selectedGoalId"
          @click="openAddMilestoneModal(selectedGoalId)"
          class="btn btn-primary"
        >
          <i class="bi bi-plus-circle"></i> Add Milestone
        </button>
      </div>

      <div v-if="!selectedGoalId" class="alert alert-info">
        <i class="bi bi-info-circle"></i> Please select a goal from the Overview tab to view its milestones.
      </div>

      <div v-else-if="milestones.length === 0" class="text-center py-5">
        <i class="bi bi-flag" style="font-size: 3rem; color: #ccc;"></i>
        <h5 class="mt-3">No Milestones Yet</h5>
        <p class="text-muted">Add milestones to track progress on this goal!</p>
      </div>

      <div v-else class="list-group">
        <div
          v-for="milestone in milestones"
          :key="milestone.id"
          class="list-group-item"
        >
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2 mb-2">
                <h6 class="mb-0">{{ milestone.title }}</h6>
                <span class="badge" :class="getStatusBadgeClass(milestone.status)">
                  {{ milestone.status.replace('_', ' ') }}
                </span>
              </div>
              <p v-if="milestone.description" class="mb-2 text-muted small">{{ milestone.description }}</p>
              <div class="d-flex gap-3 text-muted small">
                <span><i class="bi bi-calendar"></i> Due: {{ formatDate(milestone.dueDate) }}</span>
                <span v-if="milestone.estimatedEffortHours">
                  <i class="bi bi-clock"></i> {{ milestone.estimatedEffortHours }}h
                </span>
                <span v-if="milestone.completionDate" class="text-success">
                  <i class="bi bi-check-circle"></i> Completed {{ formatDate(milestone.completionDate) }}
                </span>
              </div>
            </div>
            <div class="btn-group">
              <button
                v-if="milestone.status !== 'completed'"
                @click="completeMilestone(milestone.id)"
                class="btn btn-sm btn-outline-success"
                title="Complete"
              >
                <i class="bi bi-check"></i>
              </button>
              <button
                @click="deleteMilestone(milestone.id)"
                class="btn btn-sm btn-outline-danger"
                title="Delete"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Goal Modal -->
    <div
      v-if="showGoalModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0,0,0,0.5);"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingGoal ? 'Edit Goal' : 'Add Goal' }}</h5>
            <button type="button" class="btn-close" @click="showGoalModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Category</label>
              <select v-model="goalForm.category" class="form-select">
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                  {{ cat.icon }} {{ cat.label }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Title</label>
              <input v-model="goalForm.title" type="text" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Description</label>
              <textarea v-model="goalForm.description" class="form-control" rows="3"></textarea>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Priority (1-5)</label>
                <input v-model.number="goalForm.priority" type="number" class="form-control" min="1" max="5" />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Target Year</label>
                <select v-model.number="goalForm.targetYear" class="form-select">
                  <option :value="1">Year 1</option>
                  <option :value="2">Year 2</option>
                  <option :value="3">Year 3</option>
                  <option :value="4">Year 4</option>
                  <option :value="5">Year 5</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showGoalModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveGoal">Save Goal</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Milestone Modal -->
    <div
      v-if="showMilestoneModal"
      class="modal fade show d-block"
      tabindex="-1"
      style="background-color: rgba(0,0,0,0.5);"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingMilestone ? 'Edit Milestone' : 'Add Milestone' }}</h5>
            <button type="button" class="btn-close" @click="showMilestoneModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Title</label>
              <input v-model="milestoneForm.title" type="text" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Description</label>
              <textarea v-model="milestoneForm.description" class="form-control" rows="3"></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label">Due Date</label>
              <input v-model="milestoneForm.dueDate" type="date" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Estimated Effort (hours)</label>
              <input v-model.number="milestoneForm.estimatedEffortHours" type="number" class="form-control" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showMilestoneModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="saveMilestone">Save Milestone</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="container py-5 text-center">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
</template>

<style scoped>
.nav-tabs .nav-link {
  cursor: pointer;
}
</style>
