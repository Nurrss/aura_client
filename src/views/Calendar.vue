<script setup>
import { onMounted, ref, computed } from 'vue'
import draggable from 'vuedraggable'
import { useTaskStore } from '../stores/taskStore.js'

const taskStore = useTaskStore()
const weekStart = ref(getMonday(new Date()))
const showModal = ref(false)
const modalTargetDate = ref('')
const newTask = ref({ title: '', startTime: '09:00', endTime: '10:00', priority: 'medium' })
const loading = ref(false)
const error = ref('')

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay() || 7
  if (day !== 1) d.setHours(-24 * (day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

const daysOfWeek = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return d
  })
})

const tasksByDate = computed(() => {
  const map = {}
  for (const day of daysOfWeek.value) {
    const key = day.toISOString().slice(0, 10)
    map[key] = []
  }
  for (const t of taskStore.tasks) {
    const key = t.date || (t.startTime ? new Date(t.startTime).toISOString().slice(0, 10) : null)
    if (map[key]) map[key].push({ ...t })
  }
  return map
})

function openAddTaskModal(dateIso) {
  modalTargetDate.value = dateIso
  newTask.value = { title: '', startTime: '09:00', endTime: '10:00', priority: 'medium' }
  showModal.value = true
}

async function addTask() {
  try {
    await taskStore.createTask({
      title: newTask.value.title,
      startTime: `${modalTargetDate.value}T${newTask.value.startTime}:00`,
      endTime: `${modalTargetDate.value}T${newTask.value.endTime}:00`,
      priority: newTask.value.priority,
      status: 'pending',
      date: modalTargetDate.value,
    })
    showModal.value = false
  } catch (e) {
    error.value = e.message || 'Failed to create task'
  }
}

async function onDragChange(dateIso, evt) {
  const list = tasksByDate.value[dateIso]
  // Update moved card times based on its date; keep same start/end times substring if present
  const moved = evt?.moved?.element
  if (moved) {
    const start = moved.startTime?.slice(11, 16) || '09:00'
    const end = moved.endTime?.slice(11, 16) || '10:00'
    try {
      await taskStore.moveTask(moved.id, `${dateIso}T${start}:00`, `${dateIso}T${end}:00`)
    } catch (e) {
      error.value = e.message || 'Failed to move task'
    }
  }
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const from = new Date(weekStart.value)
    const to = new Date(weekStart.value)
    to.setDate(to.getDate() + 6)
    await taskStore.loadTasks(from.toISOString(), to.toISOString())
  } catch (e) {
    error.value = e.message || 'Failed to load events'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container">
    <h2 class="mb-4">Calendar</h2>
    <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
      {{ error }}
      <button type="button" class="btn-close" @click="error = ''" aria-label="Close"></button>
    </div>
    <div class="table-responsive">
      <table class="table table-bordered align-middle">
        <thead class="table-light">
          <tr>
            <th v-for="d in daysOfWeek" :key="d.toDateString()" class="text-center">
              {{ d.toLocaleDateString(undefined, { weekday: 'short' }) }}<br />
              <small class="text-secondary">{{ d.toLocaleDateString() }}</small>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              v-for="d in daysOfWeek"
              :key="d.toISOString()"
              style="min-width: 220px; vertical-align: top"
            >
              <div v-if="loading" class="text-center my-3">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <button
                  class="btn btn-sm btn-outline-primary"
                  @click="openAddTaskModal(d.toISOString().slice(0, 10))"
                >
                  Add
                </button>
              </div>
              <draggable
                :list="tasksByDate[d.toISOString().slice(0, 10)]"
                item-key="id"
                group="calendar"
                class="d-grid gap-2"
                @change="onDragChange(d.toISOString().slice(0, 10), $event)"
              >
                <template #item="{ element }">
                  <div class="card p-2">
                    <div class="d-flex justify-content-between">
                      <span class="fw-semibold">{{ element.title }}</span>
                      <span class="badge bg-secondary"
                        >{{ element.startTime }}–{{ element.endTime }}</span
                      >
                    </div>
                    <small class="text-secondary">Priority: {{ element.priority }}</small>
                  </div>
                </template>
                <template #footer>
                  <div
                    v-if="tasksByDate[d.toISOString().slice(0, 10)].length === 0"
                    class="text-secondary small"
                  >
                    No tasks
                  </div>
                </template>
              </draggable>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      class="modal"
      tabindex="-1"
      :class="{ show: showModal }"
      style="display: block"
      v-if="showModal"
      role="dialog"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add Task</h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="showModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Title</label>
              <input v-model="newTask.title" class="form-control" placeholder="Task title" />
            </div>
            <div class="row g-2">
              <div class="col">
                <label class="form-label">Start</label>
                <input v-model="newTask.startTime" type="time" class="form-control" />
              </div>
              <div class="col">
                <label class="form-label">End</label>
                <input v-model="newTask.endTime" type="time" class="form-control" />
              </div>
            </div>
            <div class="mt-3">
              <label class="form-label">Priority</label>
              <select v-model="newTask.priority" class="form-select">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showModal = false">Cancel</button>
            <button class="btn btn-primary" :disabled="!newTask.title" @click="addTask">Add</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
