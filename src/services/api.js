/**
 * Axios API client with JWT auth interceptor.
 * All requests are prefixed with /api.
 */
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Attach JWT token to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor ────────────────────────────────────────────────────
// Handle 401 globally — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
}

// ─── Emotion API ──────────────────────────────────────────────────────────────

export const emotionAPI = {
  /**
   * Send a base64 image frame for facial emotion detection.
   * @param {string} base64Image - base64 encoded image string
   */
  detectFacial: (base64Image) =>
    api.post('/emotion/facial', { image: base64Image }),

  /**
   * Send an audio Blob for speech emotion detection.
   * @param {Blob} audioBlob - recorded audio blob
   */
  detectSpeech: (audioBlob) => {
    const formData = new FormData()
    formData.append('audio', audioBlob, `recording.${audioBlob._ext || 'webm'}`)
    return api.post('/emotion/speech', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /** Get emotion detection history */
  getHistory: (params = {}) => api.get('/emotion/history', { params }),

  /** Get aggregated emotion statistics */
  getStats: () => api.get('/emotion/stats'),
}

export default api
