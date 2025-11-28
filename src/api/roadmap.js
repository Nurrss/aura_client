import api from './index.js'

function formatError(e, fallback) {
  const msg = e?.response?.data?.message || e?.message || fallback
  return new Error(msg)
}

// ============ ROADMAP API ============

export async function getRoadmaps(filters = {}) {
  try {
    const res = await api.get('/api/roadmap', { params: filters })
    return res.data?.roadmaps || []
  } catch (e) {
    throw formatError(e, 'Failed to load roadmaps')
  }
}

export async function getRoadmapById(id, options = {}) {
  try {
    const res = await api.get(`/api/roadmap/${id}`, { params: options })
    return res.data?.roadmap
  } catch (e) {
    throw formatError(e, 'Failed to load roadmap')
  }
}

export async function createRoadmap(data) {
  try {
    const res = await api.post('/api/roadmap', data)
    return res.data?.roadmap
  } catch (e) {
    throw formatError(e, 'Failed to create roadmap')
  }
}

export async function updateRoadmap(id, data) {
  try {
    const res = await api.patch(`/api/roadmap/${id}`, data)
    return res.data?.roadmap
  } catch (e) {
    throw formatError(e, 'Failed to update roadmap')
  }
}

export async function deleteRoadmap(id) {
  try {
    const res = await api.delete(`/api/roadmap/${id}`)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to delete roadmap')
  }
}

export async function getRoadmapStats(id) {
  try {
    const res = await api.get(`/api/roadmap/${id}/stats`)
    return res.data?.stats
  } catch (e) {
    throw formatError(e, 'Failed to load statistics')
  }
}

export async function generateRoadmap(data) {
  try {
    const res = await api.post('/api/roadmap/generate', data)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to generate roadmap')
  }
}

// ============ GOAL API ============

export async function getGoals(roadmapId, filters = {}) {
  try {
    const res = await api.get(`/api/roadmap/${roadmapId}/goals`, { params: filters })
    return res.data?.goals || []
  } catch (e) {
    throw formatError(e, 'Failed to load goals')
  }
}

export async function getGoalById(id, options = {}) {
  try {
    const res = await api.get(`/api/roadmap/goals/${id}`, { params: options })
    return res.data?.goal
  } catch (e) {
    throw formatError(e, 'Failed to load goal')
  }
}

export async function createGoal(roadmapId, data) {
  try {
    const res = await api.post(`/api/roadmap/${roadmapId}/goals`, data)
    return res.data?.goal
  } catch (e) {
    throw formatError(e, 'Failed to create goal')
  }
}

export async function updateGoal(id, data) {
  try {
    const res = await api.patch(`/api/roadmap/goals/${id}`, data)
    return res.data?.goal
  } catch (e) {
    throw formatError(e, 'Failed to update goal')
  }
}

export async function deleteGoal(id) {
  try {
    const res = await api.delete(`/api/roadmap/goals/${id}`)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to delete goal')
  }
}

export async function reorderGoals(goals) {
  try {
    const res = await api.post('/api/roadmap/goals/reorder', { goals })
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to reorder goals')
  }
}

// ============ MILESTONE API ============

export async function getMilestones(goalId, filters = {}) {
  try {
    const res = await api.get(`/api/roadmap/goals/${goalId}/milestones`, { params: filters })
    return res.data?.milestones || []
  } catch (e) {
    throw formatError(e, 'Failed to load milestones')
  }
}

export async function getMilestoneById(id, options = {}) {
  try {
    const res = await api.get(`/api/roadmap/milestones/${id}`, { params: options })
    return res.data?.milestone
  } catch (e) {
    throw formatError(e, 'Failed to load milestone')
  }
}

export async function getUpcomingMilestones(roadmapId, options = {}) {
  try {
    const res = await api.get(`/api/roadmap/${roadmapId}/milestones/upcoming`, { params: options })
    return res.data?.milestones || []
  } catch (e) {
    throw formatError(e, 'Failed to load upcoming milestones')
  }
}

export async function createMilestone(goalId, data) {
  try {
    const res = await api.post(`/api/roadmap/goals/${goalId}/milestones`, data)
    return res.data?.milestone
  } catch (e) {
    throw formatError(e, 'Failed to create milestone')
  }
}

export async function updateMilestone(id, data) {
  try {
    const res = await api.patch(`/api/roadmap/milestones/${id}`, data)
    return res.data?.milestone
  } catch (e) {
    throw formatError(e, 'Failed to update milestone')
  }
}

export async function completeMilestone(id) {
  try {
    const res = await api.post(`/api/roadmap/milestones/${id}/complete`)
    return res.data?.milestone
  } catch (e) {
    throw formatError(e, 'Failed to complete milestone')
  }
}

export async function deleteMilestone(id) {
  try {
    const res = await api.delete(`/api/roadmap/milestones/${id}`)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to delete milestone')
  }
}

export async function reorderMilestones(milestones) {
  try {
    const res = await api.post('/api/roadmap/milestones/reorder', { milestones })
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to reorder milestones')
  }
}
