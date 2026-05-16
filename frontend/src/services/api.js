import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para requests (ej. agregar token en el futuro)
api.interceptors.request.use(
  (config) => {
    // TODO: Agregar token de autenticacion si se implementa login
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para responses (manejo global de errores)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en la petición API:', error);
    return Promise.reject(error);
  }
);

export default api;
