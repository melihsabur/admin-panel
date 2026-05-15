import axios from 'axios'

const API_URL = '/api'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  register: (data) => api.post('/auth/register', data),
}

export const groupAPI = {
  list: () => api.get('/groups/'),
  get: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups/', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
}

export const screenAPI = {
  list: () => api.get('/screens/'),
  myScreens: () => api.get('/screens/my-screens'),
  groupScreens: (groupId) => api.get(`/screens/group/${groupId}`),
  assign: (data) => api.post('/screens/assign', data),
  updateAssignment: (id, data) => api.put(`/screens/assign/${id}`, data),
  removeAssignment: (id) => api.delete(`/screens/assign/${id}`),
}

export const userAPI = {
  list: (groupId) => api.get('/users/', { params: groupId ? { group_id: groupId } : {} }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

export const fileAPI = {
  list: () => api.get('/files/'),
  upload: (formData) => api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/files/${id}`),
}

export const logAPI = {
  list: (params) => api.get('/logs/', { params }),
  stats: () => api.get('/logs/stats'),
}

export const aiAPI = {
  analyze: (data) => api.post('/ai/analyze', data),
  prompt: (data) => api.post('/ai/prompt', data),
  getHtml: (fileId) => api.get(`/ai/html/${fileId}`),
  saveHtml: (fileId, html) => api.put(`/ai/html/${fileId}`, { html }),
}

export default api
