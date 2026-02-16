import axios from 'axios';

// Base URL configuration (can be updated via environment variables)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create Axios Instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add JWT Token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`[API] Attaching token: ${token.substring(0, 10)}...`);
        } else {
            console.warn('[API] No token found in localStorage');
        }

        // Fix for File Uploads: Let browser set Content-Type with boundary for FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Optional: Redirect to login or clear token on 401
            // window.location.href = '/login';
            console.warn('Unauthorized access. Please login again.');
        }
        return Promise.reject(error);
    }
);

export default api;
