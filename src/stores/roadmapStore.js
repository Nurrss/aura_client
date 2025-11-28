import { defineStore } from 'pinia'
import {
  getRoadmaps as apiGetRoadmaps,
  getRoadmapById as apiGetRoadmapById,
  createRoadmap as apiCreateRoadmap,
  updateRoadmap as apiUpdateRoadmap,
  deleteRoadmap as apiDeleteRoadmap,
  getRoadmapStats as apiGetRoadmapStats,
  generateRoadmap as apiGenerateRoadmap,
  getGoals as apiGetGoals,
  createGoal as apiCreateGoal,
  updateGoal as apiUpdateGoal,
  deleteGoal as apiDeleteGoal,
  reorderGoals as apiReorderGoals,
  getMilestones as apiGetMilestones,
  createMilestone as apiCreateMilestone,
  updateMilestone as apiUpdateMilestone,
  completeMilestone as apiCompleteMilestone,
  deleteMilestone as apiDeleteMilestone,
  getUpcomingMilestones as apiGetUpcomingMilestones,
} from '../api/roadmap.js'

export const useRoadmapStore = defineStore('roadmap', {
  state: () => ({
    roadmaps: [],
    currentRoadmap: null,
    currentGoals: [],
    currentMilestones: [],
    upcomingMilestones: [],
    stats: null,
    loading: false,
    error: null,
    generatingRoadmap: false,
  }),

  getters: {
    activeRoadmap: (state) => {
      return state.roadmaps.find((r) => r.status === 'active') || null
    },
    roadmapProgress: (state) => {
      return state.currentRoadmap?.progressPercentage || 0
    },
    goalsByCategory: (state) => {
      const grouped = {}
      state.currentGoals.forEach((goal) => {
        if (!grouped[goal.category]) {
          grouped[goal.category] = []
        }
        grouped[goal.category].push(goal)
      })
      return grouped
    },
    completedGoalsCount: (state) => {
      return state.currentGoals.filter((g) => g.status === 'completed').length
    },
    totalGoalsCount: (state) => {
      return state.currentGoals.length
    },
  },

  actions: {
    // ============ ROADMAP ACTIONS ============

    async loadRoadmaps(filters = {}) {
      this.loading = true
      this.error = null
      try {
        this.roadmaps = await apiGetRoadmaps(filters)
      } catch (e) {
        this.error = e.message || 'Failed to load roadmaps'
      } finally {
        this.loading = false
      }
    },

    async loadRoadmapById(id, options = {}) {
      this.loading = true
      this.error = null
      try {
        this.currentRoadmap = await apiGetRoadmapById(id, options)
        if (this.currentRoadmap.goals) {
          this.currentGoals = this.currentRoadmap.goals
        }
        return this.currentRoadmap
      } catch (e) {
        this.error = e.message || 'Failed to load roadmap'
        throw e
      } finally {
        this.loading = false
      }
    },

    async createRoadmap(data) {
      this.error = null
      try {
        const created = await apiCreateRoadmap(data)
        this.roadmaps.push(created)
        this.currentRoadmap = created
        return created
      } catch (e) {
        this.error = e.message || 'Failed to create roadmap'
        throw e
      }
    },

    async updateRoadmap(id, updates) {
      this.error = null
      try {
        const updated = await apiUpdateRoadmap(id, updates)
        this.roadmaps = this.roadmaps.map((r) => (r.id === id ? updated : r))
        if (this.currentRoadmap?.id === id) {
          this.currentRoadmap = { ...this.currentRoadmap, ...updated }
        }
        return updated
      } catch (e) {
        this.error = e.message || 'Failed to update roadmap'
        throw e
      }
    },

    async deleteRoadmap(id) {
      this.error = null
      try {
        await apiDeleteRoadmap(id)
        this.roadmaps = this.roadmaps.filter((r) => r.id !== id)
        if (this.currentRoadmap?.id === id) {
          this.currentRoadmap = null
          this.currentGoals = []
        }
      } catch (e) {
        this.error = e.message || 'Failed to delete roadmap'
        throw e
      }
    },

    async loadRoadmapStats(id) {
      this.error = null
      try {
        this.stats = await apiGetRoadmapStats(id)
        return this.stats
      } catch (e) {
        this.error = e.message || 'Failed to load statistics'
        throw e
      }
    },

    async generateRoadmap(data) {
      this.generatingRoadmap = true
      this.error = null
      try {
        const result = await apiGenerateRoadmap(data)
        const { roadmap, goals } = result
        this.roadmaps.push(roadmap)
        this.currentRoadmap = roadmap
        this.currentGoals = goals || []
        return result
      } catch (e) {
        this.error = e.message || 'Failed to generate roadmap'
        throw e
      } finally {
        this.generatingRoadmap = false
      }
    },

    // ============ GOAL ACTIONS ============

    async loadGoals(roadmapId, filters = {}) {
      this.loading = true
      this.error = null
      try {
        this.currentGoals = await apiGetGoals(roadmapId, filters)
      } catch (e) {
        this.error = e.message || 'Failed to load goals'
      } finally {
        this.loading = false
      }
    },

    async createGoal(roadmapId, data) {
      this.error = null
      try {
        const created = await apiCreateGoal(roadmapId, data)
        this.currentGoals.push(created)
        return created
      } catch (e) {
        this.error = e.message || 'Failed to create goal'
        throw e
      }
    },

    async updateGoal(id, updates) {
      this.error = null
      try {
        const updated = await apiUpdateGoal(id, updates)
        this.currentGoals = this.currentGoals.map((g) => (g.id === id ? updated : g))
        // Refresh roadmap progress
        if (this.currentRoadmap) {
          await this.loadRoadmapById(this.currentRoadmap.id, { includeGoals: false })
        }
        return updated
      } catch (e) {
        this.error = e.message || 'Failed to update goal'
        throw e
      }
    },

    async deleteGoal(id) {
      this.error = null
      try {
        await apiDeleteGoal(id)
        this.currentGoals = this.currentGoals.filter((g) => g.id !== id)
        // Refresh roadmap progress
        if (this.currentRoadmap) {
          await this.loadRoadmapById(this.currentRoadmap.id, { includeGoals: false })
        }
      } catch (e) {
        this.error = e.message || 'Failed to delete goal'
        throw e
      }
    },

    async reorderGoals(goals) {
      this.error = null
      try {
        await apiReorderGoals(goals)
        // Update local state
        const orderMap = Object.fromEntries(goals.map((g) => [g.id, g.order]))
        this.currentGoals = this.currentGoals
          .map((g) => ({ ...g, order: orderMap[g.id] ?? g.order }))
          .sort((a, b) => a.order - b.order)
      } catch (e) {
        this.error = e.message || 'Failed to reorder goals'
        throw e
      }
    },

    // ============ MILESTONE ACTIONS ============

    async loadMilestones(goalId, filters = {}) {
      this.loading = true
      this.error = null
      try {
        this.currentMilestones = await apiGetMilestones(goalId, filters)
      } catch (e) {
        this.error = e.message || 'Failed to load milestones'
      } finally {
        this.loading = false
      }
    },

    async loadUpcomingMilestones(roadmapId, options = {}) {
      this.error = null
      try {
        this.upcomingMilestones = await apiGetUpcomingMilestones(roadmapId, options)
        return this.upcomingMilestones
      } catch (e) {
        this.error = e.message || 'Failed to load upcoming milestones'
        throw e
      }
    },

    async createMilestone(goalId, data) {
      this.error = null
      try {
        const created = await apiCreateMilestone(goalId, data)
        this.currentMilestones.push(created)
        return created
      } catch (e) {
        this.error = e.message || 'Failed to create milestone'
        throw e
      }
    },

    async updateMilestone(id, updates) {
      this.error = null
      try {
        const updated = await apiUpdateMilestone(id, updates)
        this.currentMilestones = this.currentMilestones.map((m) => (m.id === id ? updated : m))
        // Refresh roadmap progress
        if (this.currentRoadmap) {
          await this.loadRoadmapById(this.currentRoadmap.id, { includeGoals: false })
        }
        return updated
      } catch (e) {
        this.error = e.message || 'Failed to update milestone'
        throw e
      }
    },

    async completeMilestone(id) {
      this.error = null
      try {
        const completed = await apiCompleteMilestone(id)
        this.currentMilestones = this.currentMilestones.map((m) =>
          m.id === id ? { ...m, status: 'completed', completionDate: new Date().toISOString() } : m
        )
        this.upcomingMilestones = this.upcomingMilestones.filter((m) => m.id !== id)
        // Refresh roadmap progress
        if (this.currentRoadmap) {
          await this.loadRoadmapById(this.currentRoadmap.id, { includeGoals: false })
        }
        return completed
      } catch (e) {
        this.error = e.message || 'Failed to complete milestone'
        throw e
      }
    },

    async deleteMilestone(id) {
      this.error = null
      try {
        await apiDeleteMilestone(id)
        this.currentMilestones = this.currentMilestones.filter((m) => m.id !== id)
        this.upcomingMilestones = this.upcomingMilestones.filter((m) => m.id !== id)
        // Refresh roadmap progress
        if (this.currentRoadmap) {
          await this.loadRoadmapById(this.currentRoadmap.id, { includeGoals: false })
        }
      } catch (e) {
        this.error = e.message || 'Failed to delete milestone'
        throw e
      }
    },

    // ============ UTILITY ACTIONS ============

    clearError() {
      this.error = null
    },

    clearCurrentRoadmap() {
      this.currentRoadmap = null
      this.currentGoals = []
      this.currentMilestones = []
      this.upcomingMilestones = []
      this.stats = null
    },
  },
})
