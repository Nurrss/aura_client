<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/taskStore.js'
import dayjs from 'dayjs'

const taskStore = useTaskStore()
const currentFilter = ref('all')
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const taskToDelete = ref(null)
const editingTask = ref(null)

const formData = ref({
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  isAllDay: false,
  category: '',
  priority: 'normal',
  status: 'pending',
})

const formErrors = ref({
  title: '',
  dates: '',
})

onMounted(async () => {
  await taskStore.loadTasks()
})

const filteredTasks = computed(() => {
  if (currentFilter.value === 'all') return taskStore.tasks
  return taskStore.tasks.filter((t) => t.status === currentFilter.value)
})

const tasksByStatus = computed(() => ({
  all: taskStore.tasks.length,
  pending: taskStore.tasks.filter((t) => t.status === 'pending').length,
  in_progress: taskStore.tasks.filter((t) => t.status === 'in_progress').length,
  completed: taskStore.tasks.filter((t) => t.status === 'completed').length,
}))

function openAddModal() {
  editingTask.value = null
  formData.value = {
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    isAllDay: false,
    category: '',
    priority: 'normal',
    status: 'pending',
  }
  showModal.value = true
}

function openEditModal(task) {
  editingTask.value = task
  formData.value = {
    title: task.title || '',
    description: task.description || '',
    startTime: task.startTime ? dayjs(task.startTime).format('YYYY-MM-DDTHH:mm') : '',
    endTime: task.endTime ? dayjs(task.endTime).format('YYYY-MM-DDTHH:mm') : '',
    isAllDay: task.isAllDay || false,
    category: task.category || '',
    priority: task.priority || 'normal',
    status: task.status || 'pending',
  }
  showModal.value = true
}

function validateForm() {
  formErrors.value.title = ''
  formErrors.value.dates = ''
  let isValid = true

  // Title validation
  if (!formData.value.title.trim()) {
    formErrors.value.title = 'Title is required'
    isValid = false
  } else if (formData.value.title.trim().length < 3) {
    formErrors.value.title = 'Title must be at least 3 characters'
    isValid = false
  }

  // Date validation
  if (formData.value.startTime && formData.value.endTime) {
    const start = dayjs(formData.value.startTime)
    const end = dayjs(formData.value.endTime)
    if (end.isBefore(start)) {
      formErrors.value.dates = 'End time cannot be before start time'
      isValid = false
    }
  }

  return isValid
}

async function saveTask() {
  if (!validateForm()) {
    return
  }

  const payload = {
    title: formData.value.title,
    description: formData.value.description || null,
    startTime: formData.value.startTime || null,
    endTime: formData.value.endTime || null,
    isAllDay: formData.value.isAllDay,
    category: formData.value.category || null,
    priority: formData.value.priority,
    status: formData.value.status,
  }

  try {
    if (editingTask.value) {
      await taskStore.updateTask(editingTask.value.id, payload)
    } else {
      await taskStore.createTask(payload)
    }
    showModal.value = false
  } catch (e) {
    // Error will be displayed from store
    console.error('Failed to save task:', e)
  }
}

async function toggleComplete(task) {
  if (task.status === 'completed') return
  try {
    await taskStore.completeTask(task.id)
  } catch (e) {
    alert(e.message || 'Failed to complete task')
  }
}

function confirmDelete(task) {
  taskToDelete.value = task
  showDeleteConfirm.value = true
}

async function deleteTask() {
  if (!taskToDelete.value) return
  try {
    await taskStore.deleteTask(taskToDelete.value.id)
    showDeleteConfirm.value = false
    taskToDelete.value = null
  } catch (e) {
    alert(e.message || 'Failed to delete task')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dayjs(dateStr).format('MMM D, YYYY h:mm A')
}

function getPriorityBadge(priority) {
  const map = {
    low: 'bg-secondary',
    normal: 'bg-primary',
    high: 'bg-danger',
  }
  return map[priority] || 'bg-secondary'
}

function getStatusBadge(status) {
  const map = {
    pending: 'bg-warning text-dark',
    in_progress: 'bg-info',
    completed: 'bg-success',
  }
  return map[status] || 'bg-secondary'
}

function getStatusLabel(status) {
  const map = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
  }
  return map[status] || status
}
</script>

<template>
  <div class="container">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Tasks</h2>
      <button class="btn btn-primary" @click="openAddModal">
        <i class="bi bi-plus-circle"></i> Add Task
      </button>
    </div>

    <!-- Filter Tabs -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: currentFilter === 'all' }"
          @click="currentFilter = 'all'"
          href="#"
        >
          All ({{ tasksByStatus.all }})
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: currentFilter === 'pending' }"
          @click="currentFilter = 'pending'"
          href="#"
        >
          Pending ({{ tasksByStatus.pending }})
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: currentFilter === 'in_progress' }"
          @click="currentFilter = 'in_progress'"
          href="#"
        >
          In Progress ({{ tasksByStatus.in_progress }})
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: currentFilter === 'completed' }"
          @click="currentFilter = 'completed'"
          href="#"
        >
          Completed ({{ tasksByStatus.completed }})
        </a>
      </li>
    </ul>

    <!-- Loading State -->
    <div v-if="taskStore.loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="taskStore.error" class="alert alert-danger">
      {{ taskStore.error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTasks.length === 0" class="text-center py-5 text-muted">
      <p>No tasks found</p>
      <button class="btn btn-outline-primary" @click="openAddModal">Create your first task</button>
    </div>

    <!-- Tasks List -->
    <div v-else class="row g-3">
      <div v-for="task in filteredTasks" :key="task.id" class="col-12">
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <h5 class="card-title mb-2">
                  <span
                    :style="{
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    }"
                  >
                    {{ task.title }}
                  </span>
                  <span class="badge ms-2" :class="getPriorityBadge(task.priority)">
                    {{ task.priority }}
                  </span>
                  <span class="badge ms-2" :class="getStatusBadge(task.status)">
                    {{ getStatusLabel(task.status) }}
                  </span>
                </h5>
                <p v-if="task.description" class="card-text text-muted mb-2">
                  {{ task.description }}
                </p>
                <div class="small text-muted">
                  <span v-if="task.category" class="me-3">
                    <i class="bi bi-tag"></i> {{ task.category }}
                  </span>
                  <span v-if="task.startTime">
                    <i class="bi bi-calendar"></i> {{ formatDate(task.startTime) }}
                  </span>
                  <span v-if="task.endTime"> - {{ formatDate(task.endTime) }}</span>
                  <span v-if="task.isAllDay" class="badge bg-light text-dark ms-2">All Day</span>
                </div>
              </div>
              <div class="d-flex gap-2">
                <button
                  v-if="task.status !== 'completed'"
                  class="btn btn-sm btn-outline-success"
                  @click="toggleComplete(task)"
                  title="Mark as complete"
                >
                  <i class="bi bi-check-circle"></i>
                </button>
                <button
                  class="btn btn-sm btn-outline-primary"
                  @click="openEditModal(task)"
                  title="Edit task"
                >
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  class="btn btn-sm btn-outline-danger"
                  @click="confirmDelete(task)"
                  title="Delete task"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
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
            <h5 class="modal-title">{{ editingTask ? 'Edit Task' : 'Add New Task' }}</h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="taskTitle" class="form-label">Title *</label>
              <input
                id="taskTitle"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': formErrors.title }"
                v-model="formData.title"
                aria-describedby="taskTitleError"
                required
              />
              <div v-if="formErrors.title" id="taskTitleError" class="invalid-feedback">
                {{ formErrors.title }}
              </div>
            </div>
            <div class="mb-3">
              <label for="taskDescription" class="form-label">Description</label>
              <textarea
                id="taskDescription"
                class="form-control"
                rows="3"
                v-model="formData.description"
              ></textarea>
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label for="taskStartTime" class="form-label">Start Time</label>
                <input
                  id="taskStartTime"
                  type="datetime-local"
                  class="form-control"
                  :class="{ 'is-invalid': formErrors.dates }"
                  v-model="formData.startTime"
                />
              </div>
              <div class="col-6">
                <label for="taskEndTime" class="form-label">End Time</label>
                <input
                  id="taskEndTime"
                  type="datetime-local"
                  class="form-control"
                  :class="{ 'is-invalid': formErrors.dates }"
                  v-model="formData.endTime"
                  aria-describedby="datesError"
                />
              </div>
            </div>
            <div v-if="formErrors.dates" class="mb-3">
              <div id="datesError" class="text-danger small">{{ formErrors.dates }}</div>
            </div>
            <div class="mb-3 form-check">
              <input
                type="checkbox"
                class="form-check-input"
                id="isAllDay"
                v-model="formData.isAllDay"
              />
              <label class="form-check-label" for="isAllDay">All Day</label>
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label">Category</label>
                <input type="text" class="form-control" v-model="formData.category" />
              </div>
              <div class="col-6">
                <label class="form-label">Priority</label>
                <select class="form-select" v-model="formData.priority">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Status</label>
              <select class="form-select" v-model="formData.status">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showModal = false">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" @click="saveTask">Save Task</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="modal d-block"
      tabindex="-1"
      style="background-color: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-dialog-centered">
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
            <p>Are you sure you want to delete this task?</p>
            <p class="fw-bold mb-0">{{ taskToDelete?.title }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteConfirm = false">
              Cancel
            </button>
            <button type="button" class="btn btn-danger" @click="deleteTask">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nav-link {
  cursor: pointer;
}

.modal {
  display: block;
}
</style>
