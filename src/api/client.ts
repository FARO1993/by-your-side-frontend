import axios, { type AxiosInstance } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// No redirigir en 401 si la request era al propio login -- ahi un 401
// significa "credenciales invalidas", no "tu sesion expiro". Redirigir
// en ese caso recarga la pagina entera (window.location.href) y borra
// el estado de error que el formulario acaba de setear.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/api/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;