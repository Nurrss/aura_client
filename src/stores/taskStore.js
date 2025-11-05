import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import {
  getTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  moveTask as apiMoveTask,
  completeTask as apiCompleteTask,
} from '../api/tasks.js'

dayjs.extend(utc)

function toUtcIso(localIsoOrTime) {
  // Accept either an ISO string or HH:mm; produce ISO in UTC
  const d = /T/.test(localIsoOrTime)
    ? dayjs(localIsoOrTime)
    : dayjs()
        .hour(Number(localIsoOrTime.slice(0, 2)))
        .minute(Number(localIsoOrTime.slice(3, 5)))
        .second(0)
        .millisecond(0)
  return d.utc().toISOString()
}

function toLocalIso(utcIso) {
  // Convert server UTC ISO into local timezone ISO
  return dayjs(utcIso).local().toISOString()
}

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    loading: false,
    error: null,
  }),
  getters: {
    getTodayTasks: (state) => {
      const today = dayjs().format('YYYY-MM-DD')
      return state.tasks.filter((t) => {
        const date = t.date || (t.startTime ? dayjs(t.startTime).format('YYYY-MM-DD') : null)
        return date === today && t.status !== 'done'
      })
    },
  },
  actions: {
    async loadTasks(from, to) {
      this.loading = true
      this.error = null
      try {
        const data = await getTasks({ from, to })
        // Normalize times to local ISO for state
        this.tasks = (data || []).map((t) => ({
          ...t,
          startTime: t.startTime ? toLocalIso(t.startTime) : t.startTime,
          endTime: t.endTime ? toLocalIso(t.endTime) : t.endTime,
        }))
      } catch (e) {
        this.error = e.message || 'Failed to load tasks'
      } finally {
        this.loading = false
      }
    },
    async createTask(task) {
      this.error = null
      try {
        const payload = {
          ...task,
          startTime: task.startTime ? toUtcIso(task.startTime) : task.startTime,
          endTime: task.endTime ? toUtcIso(task.endTime) : task.endTime,
        }
        const created = await apiCreateTask(payload)
        const normalized = {
          ...created,
          startTime: created.startTime ? toLocalIso(created.startTime) : created.startTime,
          endTime: created.endTime ? toLocalIso(created.endTime) : created.endTime,
        }
        this.tasks.push(normalized)
        return normalized
      } catch (e) {
        this.error = e.message || 'Failed to create task'
        throw e
      }
    },
    async updateTask(id, updates) {
      this.error = null
      try {
        const payload = {
          ...updates,
          ...(updates.startTime ? { startTime: toUtcIso(updates.startTime) } : {}),
          ...(updates.endTime ? { endTime: toUtcIso(updates.endTime) } : {}),
        }
        const updated = await apiUpdateTask(id, payload)
        const normalized = {
          ...updated,
          startTime: updated.startTime ? toLocalIso(updated.startTime) : updated.startTime,
          endTime: updated.endTime ? toLocalIso(updated.endTime) : updated.endTime,
        }
        this.tasks = this.tasks.map((t) => (t.id === id ? normalized : t))
        return normalized
      } catch (e) {
        this.error = e.message || 'Failed to update task'
        throw e
      }
    },
    async moveTask(id, start, end) {
      this.error = null
      try {
        const moved = await apiMoveTask(id, toUtcIso(start), toUtcIso(end))
        const normalized = {
          ...moved,
          startTime: moved.startTime ? toLocalIso(moved.startTime) : moved.startTime,
          endTime: moved.endTime ? toLocalIso(moved.endTime) : moved.endTime,
        }
        this.tasks = this.tasks.map((t) => (t.id === id ? normalized : t))
        return normalized
      } catch (e) {
        this.error = e.message || 'Failed to move task'
        throw e
      }
    },
    async completeTask(id) {
      this.error = null
      try {
        const completed = await apiCompleteTask(id)
        this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, status: 'done' } : t))
        return completed
      } catch (e) {
        this.error = e.message || 'Failed to complete task'
        throw e
      }
    },
  },
})
