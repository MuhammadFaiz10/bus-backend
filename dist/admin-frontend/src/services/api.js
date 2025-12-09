import axios from 'axios';
const base = (import.meta.env.VITE_API_BASE_URL) || '';
const api = axios.create({ baseURL: base });
api.interceptors.request.use((cfg) => {
    const token = localStorage.getItem('token');
    if (token)
        cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` };
    return cfg;
});
export default api;
