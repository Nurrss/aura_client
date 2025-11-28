import api from './index.js'

function formatError(e, fallback) {
  const msg = e?.response?.data?.message || e?.message || fallback
  return new Error(msg)
}

export async function getTodayReport() {
  try {
    const res = await api.get('/api/reports/today')
    return res.data
  } catch (e) {
    throw formatError(e, "Failed to load today's report")
  }
}

export async function postDailyReport(payload) {
  try {
    const res = await api.post('/api/reports', payload)
    return res.data
  } catch (e) {
    throw formatError(e, 'Failed to submit daily report')
  }
}

export async function getReports(range = {}) {
  try {
    const res = await api.get('/api/reports', { params: range })
    // Response structure: { success, data: [...reports] }
    return res.data?.data || []
  } catch (e) {
    throw formatError(e, 'Failed to load reports')
  }
}
