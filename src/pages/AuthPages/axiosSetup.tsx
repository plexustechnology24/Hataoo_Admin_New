import axios from 'axios';
import { NavigateFunction } from 'react-router-dom';

export const setupAxiosInterceptors = (navigate: NavigateFunction) => {
  // Request interceptor - add token to all requests
  axios.interceptors.request.use(
    config => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    error => Promise.reject(error)
  );

  // Response interceptor - handle authentication errors
  axios.interceptors.response.use(
    response => response,
    error => {
      // Check if the error is due to authentication
      if (error.response && error.response.status === 401) {
        // Clear all auth data
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminEmail');
        
        // Get message from response if available
        const message = error.response.data?.message || 'Your session has expired. Please login again.';
        
        // Redirect to login with message
        navigate('/login', { state: { message } });
      }
      
      return Promise.reject(error);
    }
  );
};