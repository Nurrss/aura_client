import apiClient from './axios';

/**
 * Analytics API Client
 * Handles all analytics and AI coaching API calls
 */

// Velocity and Performance
export const getVelocity = async (days = 30) => {
  const response = await apiClient.get(`/analytics/velocity?days=${days}`);
  return response.data.data;
};

export const getStreak = async () => {
  const response = await apiClient.get('/analytics/streak');
  return response.data.data;
};

// Predictions and Insights
export const getRoadmapPrediction = async (roadmapId) => {
  const response = await apiClient.get(`/analytics/predict/${roadmapId}`);
  return response.data.data;
};

export const getBottlenecks = async () => {
  const response = await apiClient.get('/analytics/bottlenecks');
  return response.data.data;
};

export const getCategoryDistribution = async () => {
  const response = await apiClient.get('/analytics/categories');
  return response.data.data;
};

// Comprehensive Reports
export const getAnalyticsReport = async (roadmapId = null) => {
  const url = roadmapId ? `/analytics/report?roadmapId=${roadmapId}` : '/analytics/report';
  const response = await apiClient.get(url);
  return response.data.data;
};

export const getAnalyticsDashboard = async () => {
  const response = await apiClient.get('/analytics/dashboard');
  return response.data.data;
};

// AI Coaching
export const getWeeklyCoaching = async () => {
  const response = await apiClient.post('/analytics/coaching/weekly');
  return response.data.data;
};

export const getGoalRecommendations = async () => {
  const response = await apiClient.get('/analytics/recommendations/goals');
  return response.data.data;
};

export const getMilestoneSuggestions = async (goalId) => {
  const response = await apiClient.post(`/analytics/suggest/milestones/${goalId}`);
  return response.data.data;
};

export default {
  getVelocity,
  getStreak,
  getRoadmapPrediction,
  getBottlenecks,
  getCategoryDistribution,
  getAnalyticsReport,
  getAnalyticsDashboard,
  getWeeklyCoaching,
  getGoalRecommendations,
  getMilestoneSuggestions,
};
