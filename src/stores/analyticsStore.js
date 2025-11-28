import { defineStore } from 'pinia';
import * as analyticsApi from '../api/analytics';
import { useUIStore } from './uiStore';

export const useAnalyticsStore = defineStore('analytics', {
  state: () => ({
    // Dashboard data
    velocity: null,
    streak: null,
    bottlenecks: null,
    categoryDistribution: null,
    predictions: [],
    overview: null,

    // AI Coaching
    weeklyCoaching: null,
    goalRecommendations: null,

    // Loading states
    loading: false,
    loadingCoaching: false,
    loadingDashboard: false,

    // Error state
    error: null,

    // Last updated
    lastUpdated: null,
  }),

  getters: {
    /**
     * Get velocity trend indicator
     */
    velocityTrend: (state) => {
      if (!state.velocity) return null;
      return state.velocity.trend;
    },

    /**
     * Get current streak status
     */
    streakStatus: (state) => {
      if (!state.streak) return null;
      const { currentStreak, longestStreak } = state.streak;
      return {
        current: currentStreak,
        longest: longestStreak,
        isAtPeak: currentStreak === longestStreak && currentStreak > 0,
      };
    },

    /**
     * Get severity level for bottlenecks
     */
    bottleneckSeverity: (state) => {
      if (!state.bottlenecks) return 'none';
      return state.bottlenecks.summary.severity;
    },

    /**
     * Get top category by focus
     */
    topCategory: (state) => {
      if (!state.categoryDistribution?.distribution?.length) return null;
      return state.categoryDistribution.distribution[0];
    },

    /**
     * Get roadmaps that are behind schedule
     */
    behindScheduleRoadmaps: (state) => {
      if (!state.predictions?.length) return [];
      return state.predictions.filter((p) => !p.prediction.onTrack);
    },

    /**
     * Check if data needs refresh (older than 5 minutes)
     */
    needsRefresh: (state) => {
      if (!state.lastUpdated) return true;
      const fiveMinutes = 5 * 60 * 1000;
      return Date.now() - state.lastUpdated > fiveMinutes;
    },
  },

  actions: {
    /**
     * Load complete analytics dashboard
     */
    async loadDashboard() {
      this.loadingDashboard = true;
      this.error = null;

      try {
        const data = await analyticsApi.getAnalyticsDashboard();

        this.velocity = data.velocity;
        this.streak = data.streak;
        this.bottlenecks = data.bottlenecks;
        this.categoryDistribution = data.categoryDistribution;
        this.predictions = data.predictions;
        this.overview = data.overview;
        this.lastUpdated = Date.now();

        return data;
      } catch (error) {
        this.error = error.message || 'Failed to load analytics dashboard';
        const uiStore = useUIStore();
        uiStore.showToast(this.error, 'danger');
        throw error;
      } finally {
        this.loadingDashboard = false;
      }
    },

    /**
     * Load velocity data
     */
    async loadVelocity(days = 30) {
      this.loading = true;
      this.error = null;

      try {
        const velocity = await analyticsApi.getVelocity(days);
        this.velocity = velocity;
        return velocity;
      } catch (error) {
        this.error = error.message || 'Failed to load velocity';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Load streak information
     */
    async loadStreak() {
      this.loading = true;
      this.error = null;

      try {
        const streak = await analyticsApi.getStreak();
        this.streak = streak;
        return streak;
      } catch (error) {
        this.error = error.message || 'Failed to load streak';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Load bottlenecks
     */
    async loadBottlenecks() {
      this.loading = true;
      this.error = null;

      try {
        const bottlenecks = await analyticsApi.getBottlenecks();
        this.bottlenecks = bottlenecks;
        return bottlenecks;
      } catch (error) {
        this.error = error.message || 'Failed to load bottlenecks';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Load category distribution
     */
    async loadCategoryDistribution() {
      this.loading = true;
      this.error = null;

      try {
        const distribution = await analyticsApi.getCategoryDistribution();
        this.categoryDistribution = distribution;
        return distribution;
      } catch (error) {
        this.error = error.message || 'Failed to load category distribution';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Get roadmap prediction
     */
    async getRoadmapPrediction(roadmapId) {
      this.loading = true;
      this.error = null;

      try {
        const prediction = await analyticsApi.getRoadmapPrediction(roadmapId);
        return prediction;
      } catch (error) {
        this.error = error.message || 'Failed to get prediction';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Generate weekly AI coaching
     */
    async generateWeeklyCoaching() {
      this.loadingCoaching = true;
      this.error = null;

      try {
        const coaching = await analyticsApi.getWeeklyCoaching();
        this.weeklyCoaching = coaching;

        const uiStore = useUIStore();
        uiStore.showToast('AI coaching insights generated!', 'success');

        return coaching;
      } catch (error) {
        this.error = error.message || 'Failed to generate coaching';
        const uiStore = useUIStore();
        uiStore.showToast(this.error, 'danger');
        throw error;
      } finally {
        this.loadingCoaching = false;
      }
    },

    /**
     * Get goal recommendations
     */
    async loadGoalRecommendations() {
      this.loading = true;
      this.error = null;

      try {
        const recommendations = await analyticsApi.getGoalRecommendations();
        this.goalRecommendations = recommendations;
        return recommendations;
      } catch (error) {
        this.error = error.message || 'Failed to load recommendations';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Get milestone suggestions for a goal
     */
    async getMilestoneSuggestions(goalId) {
      this.loading = true;
      this.error = null;

      try {
        const suggestions = await analyticsApi.getMilestoneSuggestions(goalId);
        return suggestions;
      } catch (error) {
        this.error = error.message || 'Failed to get milestone suggestions';
        const uiStore = useUIStore();
        uiStore.showToast(this.error, 'danger');
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Refresh all analytics data
     */
    async refreshAll() {
      await this.loadDashboard();
    },

    /**
     * Clear analytics data
     */
    clearAnalytics() {
      this.velocity = null;
      this.streak = null;
      this.bottlenecks = null;
      this.categoryDistribution = null;
      this.predictions = [];
      this.overview = null;
      this.weeklyCoaching = null;
      this.goalRecommendations = null;
      this.lastUpdated = null;
    },
  },
});
