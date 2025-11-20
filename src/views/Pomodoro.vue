<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { useTaskStore } from '../stores/taskStore.js'
import { usePomodoroStore } from '../stores/pomodoroStore.js'
import { startSession, finishSession, getStats } from '../api/pomodoro.js'
import dayjs from 'dayjs'

const taskStore = useTaskStore()
const pomodoroStore = usePomodoroStore()

const selectedTaskId = ref(null)
const sessionId = ref(null)

const isRunning = ref(false)
const isBreak = ref(false)
const isLongBreak = ref(false)
const remainingSeconds = ref(0)
const intervalId = ref(null)
const completedPomodoros = ref(parseInt(localStorage.getItem('aura-pomodoro-count') || '0'))

// Preferences
const defaultFocusMin = ref(parseInt(localStorage.getItem('aura-focus-min') || '25'))
const defaultBreakMin = ref(parseInt(localStorage.getItem('aura-break-min') || '5'))
const defaultLongBreakMin = ref(parseInt(localStorage.getItem('aura-long-break') || '15'))
const customFocusMin = ref(defaultFocusMin.value)
const customBreakMin = ref(defaultBreakMin.value)
const customLongBreakMin = ref(defaultLongBreakMin.value)

// Sound notification
const notificationSound = ref(null)

// Session history
const sessionHistory = ref([])
const historyLoading = ref(false)
const showHistory = ref(false)
const totalFocusMinutes = ref(0)
const totalSessions = ref(0)

const displayTime = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const sessionTotal = computed(() => {
  if (isLongBreak.value) return customLongBreakMin.value * 60
  if (isBreak.value) return customBreakMin.value * 60
  return customFocusMin.value * 60
})

const currentSessionType = computed(() => {
  if (isLongBreak.value) return 'Long Break'
  if (isBreak.value) return 'Short Break'
  return 'Focus'
})

const pomodorosUntilLongBreak = computed(() => {
  return 4 - (completedPomodoros.value % 4)
})
const progressPercent = computed(() => {
  const used = sessionTotal.value - remainingSeconds.value
  return Math.max(0, Math.min(100, Math.round((used / sessionTotal.value) * 100)))
})

onMounted(async () => {
  await taskStore.loadTasks()
  if (taskStore.getTodayTasks.length) selectedTaskId.value = taskStore.getTodayTasks[0].id
  resetTimer()
  requestNotificationPermission()
  loadSessionHistory()

  // Load or create notification sound
  notificationSound.value = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyBzvLZiTcIF2m98OScTgwOUKzn77dhGgU7k9n0y3kpBSh+zPLaizsKElyx6OyrWBUIR6Ln8r1rHwQqfMvx2og3CBlpvfDknE4MDlCs5++3YRoFO5PZ9Mt5KQUng8zx2Ys5ChJer+jqqlYVCEag4vK+bB8EK3vM8dmINwgaaL3v5JxODA5QrOfvt2EaBTuT2fTLeSYFKX/M8NqLOwoTX7Ho6qpWEwiHo+Lyv2wfBCp7y/HZiDcIGmi97+ScTgwOUKzn77dhGgU7k9n0y3kpBSl/zPDaizsKE1+x6OqqVhMHh6Pk8r9sHwQqe8vx2Yg3CBlou+/knE4MD1Cs5++3YRoFO5PZ9Mt5KgUof8zw2oo7ChNfsvDmqlYTB4ej5PK/bB8EKnvL8dmINwgZaLvv5JtODA9QrOfvt2EaBTuT2fTLeSoFKH/M8NqKOwoTX7Lw5qpWEweHo+Tyv2wfBCp7y/HZiDcIGWi77+SbTgwPUKzn77dhGgU7k9n0y3kqBSh/zPDaizsLE1+y8OaqVhMIh6Pk8sBsIAQqe8vx2Yg4CBlou+/km04MEC9RrOjvt2EbBTuU2fTLeSoFKH/M8NqLOwoTX7Lw5qpWEweHo+Tyv2wfBCp7y/HZiDcIGWi77+SbTgwPUKzn77dhGgU7k9n0y3kqBSh/zPDaizsKE1+y8OaqVhMHh6Pk8r9sHwQqe8vx2Yg3CBlou+/km04MD1Cs5++3YRoFO5PZ9Mt5KQUof8zw2oo7ChNfsvDmqlYTB4ej5PK/bB8EKnvL8dmINwgZaLvv5JtODA9QrOfvt2EaBTuT2fTLeSoFKH/M8NqKOwoTX7Lw5qpWEweHo+Tyv2wfBCp7y/HZiDcIGWi77+SbTgwPUKzn77dhGgU7k9n0y3kqBSh/zPDaizsKE1+y8OaqVhMHh6Pk8r9sHwQqe8vx2Yg3CBlou+/km04MD1Cs5++3YRoFO5PZ9Mt5KgUof8zw2oo7ChNfsvDmqlYTB4ej5PK/bB8EKnvL8dmINwgZaLvv5JtODA9QrOfvt2EaBTuT2fTLeSoFKH/M8NqKOwoTX7Lw5qpWEweHo+Tyv2wfBCp7y/HZiDcIGWi77+SbTgwPUKzn77dhGgU7k9n0y3kqBSh/zPDaizsKE1+y8OaqVhMHh6Pk8r9sHwQqe8vx2Yg3CBlou+/km04MD1Cs5++3YRoFO5PZ9Mt5KgUof8zw2oo7ChNfsvDmqlYTB4ej5PK/bB8EKnvL8dmINwgZaLvv5JtODA9QrOfvt2EaBTuT2fTLeSoFKH/M8NqKOwoTX7Lw5qpWEweHo+Tyv2wfBCp7y/HZiDcIGWi77+SbTgwPUKzn77dhGgU7k9n0y3kqBSh/zPDaizsKE1+y8OaqVhMHh6Pk8r9sHwQqe8vx2Yg3CBlou+/km04MD1Cs5++3YRoFO5PZ9Mt5KgUof8zw')
})

async function loadSessionHistory() {
  historyLoading.value = true
  try {
    const today = dayjs().startOf('day').toISOString()
    const data = await getStats(today)
    sessionHistory.value = (data.sessions || []).reverse() // Most recent first
    totalFocusMinutes.value = data.totalMinutes || 0
    totalSessions.value = data.sessionsCount || 0
  } catch (e) {
    console.error('Failed to load session history:', e)
  } finally {
    historyLoading.value = false
  }
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

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
  if (isLongBreak.value) {
    remainingSeconds.value = customLongBreakMin.value * 60
  } else if (isBreak.value) {
    remainingSeconds.value = customBreakMin.value * 60
  } else {
    remainingSeconds.value = customFocusMin.value * 60
  }
}

function playNotificationSound() {
  try {
    if (notificationSound.value) {
      notificationSound.value.play().catch((e) => console.log('Sound play failed:', e))
    }
  } catch (e) {
    console.log('Sound notification error:', e)
  }
}

function showBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    })
  }
}

function tick() {
  if (remainingSeconds.value > 0) {
    remainingSeconds.value -= 1
    return
  }

  // Session finished - play sound and show notification
  pauseTimer()
  playNotificationSound()

  if (!isBreak.value && !isLongBreak.value) {
    // Focus session completed
    const duration = customFocusMin.value * 60
    const sid = sessionId.value
    const tid = selectedTaskId.value

    // Increment pomodoro count
    completedPomodoros.value += 1
    localStorage.setItem('aura-pomodoro-count', String(completedPomodoros.value))

    showBrowserNotification('Focus Session Complete!', `Great job! You completed a ${customFocusMin.value} minute focus session.`)

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

    // Check if it's time for long break (every 4 pomodoros)
    if (completedPomodoros.value % 4 === 0) {
      isLongBreak.value = true
      isBreak.value = false
      showBrowserNotification('Time for a Long Break!', `You've completed ${completedPomodoros.value} pomodoros. Take a ${customLongBreakMin.value} minute break.`)
    } else {
      isBreak.value = true
      isLongBreak.value = false
      showBrowserNotification('Time for a Break!', `Take a ${customBreakMin.value} minute break before your next session.`)
    }
  } else {
    // Break finished
    if (isLongBreak.value) {
      showBrowserNotification('Long Break Complete!', 'Ready to start a new pomodoro cycle?')
    } else {
      showBrowserNotification('Break Complete!', 'Time to focus again!')
    }
    isBreak.value = false
    isLongBreak.value = false
  }

  resetTimer()
}

watch([customFocusMin, customBreakMin, customLongBreakMin, isBreak, isLongBreak], () => {
  // If user changes durations mid-session and timer is stopped, reflect immediately
  if (!isRunning.value) resetTimer()
})

function resetPomodoroCount() {
  completedPomodoros.value = 0
  localStorage.setItem('aura-pomodoro-count', '0')
}

function formatSessionTime(dateStr) {
  return dayjs(dateStr).format('h:mm A')
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
</script>

<template>
  <div class="container">
    <h2 class="mb-4">Pomodoro</h2>
    <div class="row g-4">
      <div class="col-12 col-lg-8">
        <div class="card h-100">
          <div class="card-header d-flex align-items-center gap-3">
            <span class="fw-semibold">Session</span>
            <span
              class="badge"
              :class="{
                'bg-primary': !isBreak && !isLongBreak,
                'bg-info': isBreak && !isLongBreak,
                'bg-success': isLongBreak,
              }"
            >
              {{ currentSessionType }}
            </span>
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
        <!-- Pomodoro Stats -->
        <div class="card mb-3">
          <div class="card-header fw-semibold">Pomodoro Cycle</div>
          <div class="card-body">
            <div class="text-center mb-3">
              <div class="display-6 mb-2">
                <i class="bi bi-fire text-danger"></i>
                {{ completedPomodoros }}
              </div>
              <small class="text-muted">Completed Today</small>
            </div>
            <div class="d-flex justify-content-center gap-1 mb-3">
              <span
                v-for="i in 4"
                :key="i"
                class="badge"
                :class="
                  (completedPomodoros % 4) >= i || completedPomodoros % 4 === 0
                    ? 'bg-danger'
                    : 'bg-light text-dark'
                "
              >
                {{ i }}
              </span>
            </div>
            <p class="text-center small text-muted mb-2">
              {{ pomodorosUntilLongBreak }} more until long break
            </p>
            <button class="btn btn-sm btn-outline-secondary w-100" @click="resetPomodoroCount">
              Reset Counter
            </button>
          </div>
        </div>

        <!-- Preferences -->
        <div class="card">
          <div class="card-header fw-semibold">Timer Settings</div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">Focus (min)</label>
              <input type="number" min="1" class="form-control" v-model.number="customFocusMin" />
            </div>
            <div class="mb-3">
              <label class="form-label">Short Break (min)</label>
              <input
                type="number"
                min="1"
                class="form-control"
                v-model.number="customBreakMin"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Long Break (min)</label>
              <input
                type="number"
                min="1"
                class="form-control"
                v-model.number="customLongBreakMin"
              />
            </div>
            <div class="form-text">
              Defaults: {{ defaultFocusMin }} / {{ defaultBreakMin }} / {{ defaultLongBreakMin }}
              minutes
            </div>
          </div>
        </div>
      </div>

      <!-- Session History -->
      <div class="col-12 mt-4">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span class="fw-semibold">Today's Sessions</span>
            <button class="btn btn-sm btn-outline-primary" @click="showHistory = !showHistory">
              {{ showHistory ? 'Hide' : 'Show' }} History
            </button>
          </div>
          <div v-if="showHistory" class="card-body">
            <!-- Stats Summary -->
            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <div class="text-center p-3 bg-light rounded">
                  <div class="h4 mb-1">{{ totalSessions }}</div>
                  <small class="text-muted">Total Sessions</small>
                </div>
              </div>
              <div class="col-md-4">
                <div class="text-center p-3 bg-light rounded">
                  <div class="h4 mb-1">{{ formatDuration(totalFocusMinutes) }}</div>
                  <small class="text-muted">Total Focus Time</small>
                </div>
              </div>
              <div class="col-md-4">
                <div class="text-center p-3 bg-light rounded">
                  <div class="h4 mb-1">
                    {{ totalSessions > 0 ? Math.round(totalFocusMinutes / totalSessions) : 0 }}m
                  </div>
                  <small class="text-muted">Avg per Session</small>
                </div>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="historyLoading" class="text-center py-3">
              <div class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="sessionHistory.length === 0" class="text-center py-4 text-muted">
              <i class="bi bi-clock-history" style="font-size: 2rem"></i>
              <p class="mt-2 mb-0">No sessions completed yet today</p>
            </div>

            <!-- Session List -->
            <div v-else class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="session in sessionHistory" :key="session.id">
                    <td>{{ formatSessionTime(session.createdAt) }}</td>
                    <td>{{ session.duration }} min</td>
                    <td>
                      <span
                        class="badge"
                        :class="session.completed ? 'bg-success' : 'bg-secondary'"
                      >
                        {{ session.completed ? 'Completed' : 'Incomplete' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
