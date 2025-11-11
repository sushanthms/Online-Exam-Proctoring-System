import axios from 'axios';

// CRITICAL FIX: Consistent API base URL
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

console.log('🌐 API Base URL:', API_BASE);

// Set default axios configuration
axios.defaults.baseURL = API_BASE;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Request interceptor for logging
axios.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
axios.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Auth token set');
  } else {
    delete axios.defaults.headers.common['Authorization'];
    console.log('🔓 Auth token removed');
  }
}

export const authApi = {
  register: (payload) => axios.post('/auth/register', payload),
  login: (payload) => axios.post('/auth/login', payload),
  getMe: () => axios.get('/auth/me'),
  getFaceStatus: () => axios.get('/auth/face-status')
};

export const examApi = {
  getPaper: () => axios.get('/exam/paper').then(r => r.data),
  submit: (payload) => axios.post('/exam/submit', payload).then(r => r.data),
  sendProctorEvent: (payload) => axios.post('/exam/proctor-event', payload).then(r => r.data)
};

export default axios;