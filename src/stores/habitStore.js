import { defineStore } from 'pinia'
import {
  getHabits,
  createHabit as apiCreateHabit,
  updateHabit as apiUpdateHabit,
  toggleHabit as apiToggleHabit,
  deleteHabit as apiDeleteHabit,
} from '../api/habits.js'

export const useHabitStore = defineStore('habits', {
  state: () => ({
    habits: [],
    loading: false,
    error: null,
  }),
  getters: {
    activeHabits: (state) => {
      return state.habits.filter((h) => h.streak > 0)
    },
    todayCompleted: (state) => {
      const today = new Date().toISOString().split('T')[0]
      return state.habits.filter((h) => {
        if (!h.lastCompletedAt) return false
        const lastDate = new Date(h.lastCompletedAt).toISOString().split('T')[0]
        return lastDate === today
      })
    },
  },
  actions: {
    async loadHabits() {
      this.loading = true
      this.error = null
      try {
        const data = await getHabits()
        this.habits = data || []
      } catch (e) {
        this.error = e.message || 'Failed to load habits'
      } finally {
        this.loading = false
      }
    },
    async createHabit(habit) {
      this.error = null
      try {
        const created = await apiCreateHabit(habit)
        this.habits.push(created)
        return created
      } catch (e) {
        this.error = e.message || 'Failed to create habit'
        throw e
      }
    },
    async updateHabit(id, updates) {
      this.error = null
      try {
        const updated = await apiUpdateHabit(id, updates)
        this.habits = this.habits.map((h) => (h.id === id ? updated : h))
        return updated
      } catch (e) {
        this.error = e.message || 'Failed to update habit'
        throw e
      }
    },
    async toggleHabit(id) {
      this.error = null
      try {
        const updated = await apiToggleHabit(id)
        this.habits = this.habits.map((h) => (h.id === id ? updated : h))
        return updated
      } catch (e) {
        this.error = e.message || 'Failed to toggle habit'
        throw e
      }
    },
    async deleteHabit(id) {
      this.error = null
      try {
        await apiDeleteHabit(id)
        this.habits = this.habits.filter((h) => h.id !== id)
      } catch (e) {
        this.error = e.message || 'Failed to delete habit'
        throw e
      }
    },
  },
})
