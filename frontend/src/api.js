import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

export function setAuthToken(token){
  if(token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete axios.defaults.headers.common['Authorization'];
}

export const authApi = {
  register: (payload) => axios.post(`${API_BASE}/auth/register`, payload),
  login: (payload) => axios.post(`${API_BASE}/auth/login`, payload)
};

export const examApi = {
  getPaper: () => axios.get(`${API_BASE}/exam/paper`).then(r => r.data),
  submit: (payload) => axios.post(`${API_BASE}/exam/submit`, payload).then(r => r.data),
  sendProctorEvent: (payload) => axios.post(`${API_BASE}/exam/proctor-event`, payload).then(r => r.data)
};
