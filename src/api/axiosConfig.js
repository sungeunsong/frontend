import axios from 'axios';

// Create a configured axios instance
const api = axios.create({
  baseURL: '/api', // Use /api prefix which Vite proxy should forward
});

// Request interceptor to add the auth token header to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      // localStorage.removeItem('token');
      // window.location.href = '/login'; // Simple redirect
    }
    return Promise.reject(error);
  }
);

export default api;
