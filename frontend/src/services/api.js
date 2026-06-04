import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (error.config && error.config.url && error.config.url.includes('/admin/password')) {
        return Promise.reject(error); // Dejamos que el formulario maneje el error
      }
      // Verificamos si no estamos ya en la página de login para evitar bucles
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token'); // Borramos el token inválido
        // Puedes borrar otros datos si los tienes, ej: localStorage.removeItem('user');
        
        alert('Su sesión ha expirado o su turno fue reiniciado. Por favor, vuelva a iniciar sesión.');
        window.location.href = '/login'; // Redirigimos al inicio
      }
    }
    return Promise.reject(error);
  }
);

export default api;
