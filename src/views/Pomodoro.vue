<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { useTaskStore } from '../stores/taskStore.js'
import { usePomodoroStore } from '../stores/pomodoroStore.js'
import { startSession, finishSession } from '../api/pomodoro.js'

const taskStore = useTaskStore()
const pomodoroStore = usePomodoroStore()

const selectedTaskId = ref(null)
const sessionId = ref(null)

const isRunning = ref(false)
const isBreak = ref(false)
const remainingSeconds = ref(0)
const intervalId = ref(null)

// Preferences
const defaultFocusMin = ref(parseInt(localStorage.getItem('aura-focus-min') || '25'))
const defaultBreakMin = ref(parseInt(localStorage.getItem('aura-break-min') || '5'))
const customFocusMin = ref(defaultFocusMin.value)
const customBreakMin = ref(defaultBreakMin.value)

const displayTime = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const sessionTotal = computed(() =>
  isBreak.value ? customBreakMin.value * 60 : customFocusMin.value * 60,
)
const progressPercent = computed(() => {
  const used = sessionTotal.value - remainingSeconds.value
  return Math.max(0, Math.min(100, Math.round((used / sessionTotal.value) * 100)))
})

onMounted(async () => {
  await taskStore.loadTasks()
  if (taskStore.getTodayTasks.length) selectedTaskId.value = taskStore.getTodayTasks[0].id
  resetTimer()
})

async function startTimer() {
  if (isRunning.value) return
  if (!selectedTaskId.value) return
  try {
    const res = await startSession(selectedTaskId.value)
    sessionId.value = res?.id || res?.sessionId || null
    pomodoroStore.recordSession({
      id: sessionId.value,
      taskId: selectedTaskId.value,
      startAt: new Date().toISOString(),
      synced: true,
    })
  } catch (e) {
    // still allow local timer if server failed to create session
    sessionId.value = null
  }
  isRunning.value = true
  intervalId.value = setInterval(tick, 1000)
}

function pauseTimer() {
  isRunning.value = false
  clearInterval(intervalId.value)
}

function resetTimer() {
  pauseTimer()
  remainingSeconds.value = isBreak.value ? customBreakMin.value * 60 : customFocusMin.value * 60
}

function tick() {
  if (remainingSeconds.value > 0) {
    remainingSeconds.value -= 1
    return
  }
  // Session finished
  pauseTimer()
  if (!isBreak.value) {
    const duration = customFocusMin.value * 60
    const sid = sessionId.value
    const tid = selectedTaskId.value
    const attemptFinish = async (attempt = 1) => {
      try {
        if (sid) await finishSession(sid, duration, true)
        await taskStore.completeTask(tid)
        pomodoroStore.recordSession({
          id: sid || `local-${Date.now()}`,
          taskId: tid,
          endAt: new Date().toISOString(),
          duration,
          completed: true,
          synced: Boolean(sid),
        })
      } catch (e) {
        if (attempt < 3) {
          const delay = 500 * Math.pow(2, attempt - 1)
          setTimeout(() => attemptFinish(attempt + 1), delay)
          pomodoroStore.enqueueSync({ sessionId: sid, taskId: tid, duration, attempt: attempt + 1 })
        }
      }
    }
    attemptFinish(1)
  }
  // Toggle break/focus
  isBreak.value = !isBreak.value
  resetTimer()
}

watch([customFocusMin, customBreakMin, isBreak], () => {
  // If user changes durations mid-session and timer is stopped, reflect immediately
  if (!isRunning.value) resetTimer()
})
</script>

<template>
  <div class="container">
    <h2 class="mb-4">Pomodoro</h2>
    <div class="row g-4">
      <div class="col-12 col-lg-8">
        <div class="card h-100">
          <div class="card-header d-flex align-items-center gap-3">
            <span class="fw-semibold">Session</span>
            <span class="badge" :class="isBreak ? 'bg-info' : 'bg-primary'">{{
              isBreak ? 'Break' : 'Focus'
            }}</span>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">Select Task</label>
              <select v-model.number="selectedTaskId" class="form-select">
                <option v-for="t in taskStore.getTodayTasks" :key="t.id" :value="t.id">
                  {{ t.title }} ({{ t.status }})
                </option>
              </select>
            </div>
            <div class="display-3 text-center my-3">{{ displayTime }}</div>
            <div
              class="progress"
              role="progressbar"
              aria-label="Timer progress"
              :aria-valuenow="progressPercent"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <div class="d-flex justify-content-center gap-3 mt-4">
              <button class="btn btn-success" @click="startTimer" :disabled="isRunning">
                Start
              </button>
              <button class="btn btn-warning" @click="pauseTimer" :disabled="!isRunning">
                Pause
              </button>
              <button class="btn btn-secondary" @click="resetTimer">Reset</button>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-4">
        <div class="card h-100">
          <div class="card-header fw-semibold">Preferences</div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-6">
                <label class="form-label">Focus (min)</label>
                <input type="number" min="1" class="form-control" v-model.number="customFocusMin" />
              </div>
              <div class="col-6">
                <label class="form-label">Break (min)</label>
                <input type="number" min="1" class="form-control" v-model.number="customBreakMin" />
              </div>
            </div>
            <div class="form-text mt-2">
              Defaults: {{ defaultFocusMin }} / {{ defaultBreakMin }} minutes
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
