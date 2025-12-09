
import axios from 'axios';

const base = (import.meta.env.VITE_API_BASE_URL) || '';
const api = axios.create({ baseURL: base, timeout: 30000 });

// Request interceptor untuk menambahkan token
api.interceptors.request.use((cfg)=>{
  const token = localStorage.getItem('token');
  if(token) cfg.headers = { ...(cfg.headers||{}), Authorization: `Bearer ${token}` };
  return cfg;
});

// Response interceptor untuk error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract error message dari backend response
    const message = error?.response?.data?.error || error?.message || 'Terjadi kesalahan';

    // Handle 401 Unauthorized - auto logout dan redirect ke login
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Tambahkan userMessage untuk error handling yang konsisten
    const enhancedError = {
      ...error,
      userMessage: message,
      status: error?.response?.status
    };

    return Promise.reject(enhancedError);
  }
);

export default api;
