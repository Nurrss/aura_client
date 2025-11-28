<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRoadmapStore } from '../stores/roadmapStore.js'
import { useUiStore } from '../stores/uiStore.js'
import dayjs from 'dayjs'

const router = useRouter()
const roadmapStore = useRoadmapStore()
const uiStore = useUiStore()

const currentStep = ref(1)
const totalSteps = 3

// Step 1: Roadmap basics
const roadmapData = ref({
  title: '',
  visionStatement: '',
  startDate: dayjs().format('YYYY-MM-DD'),
  weeklyAvailableHours: 20,
})

// Step 2: Goals
const goals = ref([])
const currentGoal = ref({
  category: 'career',
  title: '',
  description: '',
  currentState: '',
  desiredState: '',
  importance: 3,
  targetYear: 1,
  estimatedWeeklyHours: 5,
})

// Step 3: Review & generation method
const generationMethod = ref('llm_assisted') // or 'manual'
const validationResult = ref(null)

const formErrors = ref({
  title: '',
  visionStatement: '',
  goals: '',
})

// Computed
const canProceedStep1 = computed(() => {
  return roadmapData.value.title.length >= 5 &&
         roadmapData.value.visionStatement.length >= 10
})

const canProceedStep2 = computed(() => {
  return goals.value.length >= 1
})

const categories = [
  { value: 'career', label: 'Career', icon: '💼' },
  { value: 'health', label: 'Health', icon: '💪' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'relationships', label: 'Relationships', icon: '❤️' },
  { value: 'learning', label: 'Learning', icon: '📚' },
  { value: 'personal', label: 'Personal', icon: '🌟' },
  { value: 'other', label: 'Other', icon: '📌' },
]

// Methods
function nextStep() {
  if (currentStep.value === 1 && !canProceedStep1.value) {
    uiStore.showToast('Please fill in all required fields', 'warning')
    return
  }
  if (currentStep.value === 2 && !canProceedStep2.value) {
    uiStore.showToast('Please add at least one goal', 'warning')
    return
  }
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function addGoal() {
  if (!currentGoal.value.title || !currentGoal.value.currentState || !currentGoal.value.desiredState) {
    uiStore.showToast('Please fill in all goal fields', 'warning')
    return
  }

  goals.value.push({ ...currentGoal.value })

  // Reset form
  currentGoal.value = {
    category: 'career',
    title: '',
    description: '',
    currentState: '',
    desiredState: '',
    importance: 3,
    targetYear: 1,
    estimatedWeeklyHours: 5,
  }

  uiStore.showToast('Goal added successfully', 'success')
}

function removeGoal(index) {
  goals.value.splice(index, 1)
}

function editGoal(index) {
  currentGoal.value = { ...goals.value[index] }
  goals.value.splice(index, 1)
}

async function submitRoadmap() {
  try {
    const payload = {
      title: roadmapData.value.title,
      visionStatement: roadmapData.value.visionStatement,
      startDate: dayjs(roadmapData.value.startDate).toISOString(),
      weeklyAvailableHours: roadmapData.value.weeklyAvailableHours,
      goals: goals.value,
    }

    let result
    if (generationMethod.value === 'llm_assisted') {
      result = await roadmapStore.generateRoadmap(payload)
      uiStore.showToast('Roadmap generated successfully!', 'success')
    } else {
      // Manual creation
      const roadmap = await roadmapStore.createRoadmap({
        title: payload.title,
        visionStatement: payload.visionStatement,
        startDate: payload.startDate,
        status: 'draft',
      })

      // Create goals manually
      for (const goal of payload.goals) {
        await roadmapStore.createGoal(roadmap.id, goal)
      }

      result = { roadmap }
      uiStore.showToast('Roadmap created successfully!', 'success')
    }

    // Navigate to roadmap detail page
    router.push(`/roadmap/${result.roadmap.id}`)
  } catch (error) {
    console.error('Error creating roadmap:', error)
    uiStore.showToast(error.message || 'Failed to create roadmap', 'danger')
  }
}

function cancel() {
  router.push('/roadmap')
}

// Calculate total weekly hours
const totalWeeklyHours = computed(() => {
  return goals.value.reduce((sum, goal) => sum + (goal.estimatedWeeklyHours || 0), 0)
})

const isTimeOverload = computed(() => {
  return totalWeeklyHours.value > roadmapData.value.weeklyAvailableHours
})

function getCategoryLabel(categoryValue) {
  return categories.find(c => c.value === categoryValue)?.label || categoryValue
}

function getCategoryIcon(categoryValue) {
  return categories.find(c => c.value === categoryValue)?.icon || '📌'
}
</script>

<template>
  <div class="container py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2>Create 5-Year Roadmap</h2>
        <p class="text-muted">Build your personalized path to success</p>
      </div>
      <button @click="cancel" class="btn btn-outline-secondary">
        <i class="bi bi-x-lg"></i> Cancel
      </button>
    </div>

    <!-- Progress Steps -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center">
          <div
            v-for="step in totalSteps"
            :key="step"
            class="d-flex align-items-center"
            :class="{ 'flex-fill': step < totalSteps }"
          >
            <div
              class="step-circle"
              :class="{
                'step-active': step === currentStep,
                'step-completed': step < currentStep
              }"
            >
              <i v-if="step < currentStep" class="bi bi-check-lg"></i>
              <span v-else>{{ step }}</span>
            </div>
            <div v-if="step < totalSteps" class="step-line" :class="{ 'step-line-completed': step < currentStep }"></div>
          </div>
        </div>
        <div class="d-flex justify-content-between mt-2">
          <small class="text-muted">Vision & Basics</small>
          <small class="text-muted">Add Goals</small>
          <small class="text-muted">Review & Generate</small>
        </div>
      </div>
    </div>

    <!-- Step 1: Roadmap Basics -->
    <div v-if="currentStep === 1" class="card">
      <div class="card-body">
        <h4 class="mb-4">Step 1: Define Your Vision</h4>

        <div class="mb-3">
          <label class="form-label">Roadmap Title <span class="text-danger">*</span></label>
          <input
            v-model="roadmapData.title"
            type="text"
            class="form-control"
            placeholder="e.g., My 5-Year Career Growth Plan"
            maxlength="200"
          />
          <div class="form-text">{{ roadmapData.title.length }}/200 characters</div>
        </div>

        <div class="mb-3">
          <label class="form-label">Vision Statement <span class="text-danger">*</span></label>
          <textarea
            v-model="roadmapData.visionStatement"
            class="form-control"
            rows="4"
            placeholder="Describe your long-term vision and what you want to achieve in the next 5 years..."
            maxlength="2000"
          ></textarea>
          <div class="form-text">{{ roadmapData.visionStatement.length }}/2000 characters</div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Start Date</label>
            <input
              v-model="roadmapData.startDate"
              type="date"
              class="form-control"
            />
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label">Weekly Available Hours</label>
            <input
              v-model.number="roadmapData.weeklyAvailableHours"
              type="number"
              class="form-control"
              min="1"
              max="168"
            />
            <div class="form-text">How many hours per week can you dedicate to your goals?</div>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <button @click="nextStep" class="btn btn-primary" :disabled="!canProceedStep1">
            Next <i class="bi bi-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Step 2: Add Goals -->
    <div v-if="currentStep === 2">
      <!-- Current Goals List -->
      <div v-if="goals.length > 0" class="card mb-3">
        <div class="card-body">
          <h5 class="mb-3">Your Goals ({{ goals.length }})</h5>

          <!-- Time allocation warning -->
          <div v-if="isTimeOverload" class="alert alert-warning mb-3">
            <i class="bi bi-exclamation-triangle"></i>
            <strong>Time Overload:</strong> Your goals require {{ totalWeeklyHours }}h/week,
            but you only have {{ roadmapData.weeklyAvailableHours }}h/week available.
            Consider reducing time commitments or removing some goals.
          </div>

          <div class="list-group">
            <div
              v-for="(goal, index) in goals"
              :key="index"
              class="list-group-item"
            >
              <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="fs-4">{{ getCategoryIcon(goal.category) }}</span>
                    <h6 class="mb-0">{{ goal.title }}</h6>
                    <span class="badge bg-secondary">Year {{ goal.targetYear }}</span>
                    <span class="badge" :class="{
                      'bg-danger': goal.importance === 5,
                      'bg-warning': goal.importance === 4,
                      'bg-info': goal.importance === 3,
                      'bg-secondary': goal.importance <= 2
                    }">Priority: {{ goal.importance }}</span>
                  </div>
                  <p class="mb-1 text-muted small">
                    <strong>From:</strong> {{ goal.currentState }}
                  </p>
                  <p class="mb-1 text-muted small">
                    <strong>To:</strong> {{ goal.desiredState }}
                  </p>
                  <p class="mb-0 text-muted small">
                    <i class="bi bi-clock"></i> {{ goal.estimatedWeeklyHours }}h/week
                  </p>
                </div>
                <div class="btn-group">
                  <button @click="editGoal(index)" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button @click="removeGoal(index)" class="btn btn-sm btn-outline-danger">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add New Goal Form -->
      <div class="card">
        <div class="card-body">
          <h5 class="mb-4">{{ goals.length === 0 ? 'Add Your First Goal' : 'Add Another Goal' }}</h5>

          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Category <span class="text-danger">*</span></label>
              <select v-model="currentGoal.category" class="form-select">
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                  {{ cat.icon }} {{ cat.label }}
                </option>
              </select>
            </div>

            <div class="col-md-6 mb-3">
              <label class="form-label">Goal Title <span class="text-danger">*</span></label>
              <input
                v-model="currentGoal.title"
                type="text"
                class="form-control"
                placeholder="e.g., Become a Senior Engineer"
                maxlength="200"
              />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Current State <span class="text-danger">*</span></label>
            <input
              v-model="currentGoal.currentState"
              type="text"
              class="form-control"
              placeholder="Where are you now?"
              maxlength="500"
            />
          </div>

          <div class="mb-3">
            <label class="form-label">Desired State <span class="text-danger">*</span></label>
            <input
              v-model="currentGoal.desiredState"
              type="text"
              class="form-control"
              placeholder="Where do you want to be?"
              maxlength="500"
            />
          </div>

          <div class="mb-3">
            <label class="form-label">Description (Optional)</label>
            <textarea
              v-model="currentGoal.description"
              class="form-control"
              rows="2"
              placeholder="Additional details about this goal..."
            ></textarea>
          </div>

          <div class="row">
            <div class="col-md-4 mb-3">
              <label class="form-label">Importance (1-5)</label>
              <input
                v-model.number="currentGoal.importance"
                type="range"
                class="form-range"
                min="1"
                max="5"
                step="1"
              />
              <div class="text-center">
                <span class="badge" :class="{
                  'bg-danger': currentGoal.importance === 5,
                  'bg-warning': currentGoal.importance === 4,
                  'bg-info': currentGoal.importance === 3,
                  'bg-secondary': currentGoal.importance <= 2
                }">{{ currentGoal.importance }}</span>
              </div>
            </div>

            <div class="col-md-4 mb-3">
              <label class="form-label">Target Year (1-5)</label>
              <select v-model.number="currentGoal.targetYear" class="form-select">
                <option :value="1">Year 1</option>
                <option :value="2">Year 2</option>
                <option :value="3">Year 3</option>
                <option :value="4">Year 4</option>
                <option :value="5">Year 5</option>
              </select>
            </div>

            <div class="col-md-4 mb-3">
              <label class="form-label">Est. Weekly Hours</label>
              <input
                v-model.number="currentGoal.estimatedWeeklyHours"
                type="number"
                class="form-control"
                min="1"
                max="168"
              />
            </div>
          </div>

          <button @click="addGoal" class="btn btn-success w-100">
            <i class="bi bi-plus-circle"></i> Add Goal
          </button>
        </div>
      </div>

      <div class="d-flex justify-content-between gap-2 mt-3">
        <button @click="prevStep" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left"></i> Back
        </button>
        <button @click="nextStep" class="btn btn-primary" :disabled="!canProceedStep2">
          Next <i class="bi bi-arrow-right"></i>
        </button>
      </div>
    </div>

    <!-- Step 3: Review & Generate -->
    <div v-if="currentStep === 3" class="card">
      <div class="card-body">
        <h4 class="mb-4">Step 3: Review & Generate</h4>

        <!-- Roadmap Summary -->
        <div class="alert alert-info mb-4">
          <h5>📋 Summary</h5>
          <p class="mb-1"><strong>Title:</strong> {{ roadmapData.title }}</p>
          <p class="mb-1"><strong>Start Date:</strong> {{ dayjs(roadmapData.startDate).format('MMMM D, YYYY') }}</p>
          <p class="mb-1"><strong>Goals:</strong> {{ goals.length }}</p>
          <p class="mb-0"><strong>Time Commitment:</strong> {{ totalWeeklyHours }}h/week ({{ roadmapData.weeklyAvailableHours }}h available)</p>
        </div>

        <!-- Goals Breakdown -->
        <div class="mb-4">
          <h5>Goals Breakdown</h5>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Goal</th>
                  <th>Category</th>
                  <th>Year</th>
                  <th>Importance</th>
                  <th>Hours/Week</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(goal, index) in goals" :key="index">
                  <td>{{ goal.title }}</td>
                  <td>{{ getCategoryIcon(goal.category) }} {{ getCategoryLabel(goal.category) }}</td>
                  <td>Year {{ goal.targetYear }}</td>
                  <td>
                    <span class="badge" :class="{
                      'bg-danger': goal.importance === 5,
                      'bg-warning': goal.importance === 4,
                      'bg-info': goal.importance === 3,
                      'bg-secondary': goal.importance <= 2
                    }">{{ goal.importance }}</span>
                  </td>
                  <td>{{ goal.estimatedWeeklyHours }}h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Generation Method -->
        <div class="mb-4">
          <h5>Generation Method</h5>
          <div class="form-check mb-2">
            <input
              v-model="generationMethod"
              class="form-check-input"
              type="radio"
              value="llm_assisted"
              id="methodAI"
            />
            <label class="form-check-label" for="methodAI">
              <strong>🤖 AI-Assisted Generation</strong><br>
              <small class="text-muted">
                Let AI analyze your goals and generate optimized milestones with smart scheduling
              </small>
            </label>
          </div>
          <div class="form-check">
            <input
              v-model="generationMethod"
              class="form-check-input"
              type="radio"
              value="manual"
              id="methodManual"
            />
            <label class="form-check-label" for="methodManual">
              <strong>✏️ Manual Creation</strong><br>
              <small class="text-muted">
                Create the roadmap structure and add milestones yourself later
              </small>
            </label>
          </div>
        </div>

        <div class="d-flex justify-content-between gap-2 mt-4">
          <button @click="prevStep" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left"></i> Back
          </button>
          <button
            @click="submitRoadmap"
            class="btn btn-primary btn-lg"
            :disabled="roadmapStore.generatingRoadmap"
          >
            <span v-if="roadmapStore.generatingRoadmap">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Generating...
            </span>
            <span v-else>
              <i class="bi bi-rocket"></i> Create Roadmap
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e9ecef;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.3s ease;
}

.step-circle.step-active {
  background-color: #0d6efd;
  color: white;
}

.step-circle.step-completed {
  background-color: #198754;
  color: white;
}

.step-line {
  height: 2px;
  background-color: #e9ecef;
  flex-grow: 1;
  margin: 0 10px;
  transition: all 0.3s ease;
}

.step-line.step-line-completed {
  background-color: #198754;
}
</style>
