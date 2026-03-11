import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API base URL resolution strategy:
// 1. Use EXPO_PUBLIC_API_URL if provided (recommended)
// 2. In dev, fall back to localhost / Android emulator host
// 3. In prod, fall back to a placeholder that should be replaced during deployment
const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const getBaseUrl = () => {
  // if (ENV_BASE_URL) {
  //   return ENV_BASE_URL.replace(/\/$/, '');
  // }

  // Hardcoded IP for physical device testing - FORCED
  return 'http://192.168.1.11:5000';
};

export const BASE_URL = getBaseUrl();

console.log('API configured with BASE_URL:', BASE_URL);

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  // Prevent "infinite" waiting if backend or DB is down
  timeout: 15000, // 15 seconds
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    console.log('[API Error]', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('Request made but no response received. Is the backend accessible?');
    }
    return Promise.reject(error);
  }
);

export default api;
