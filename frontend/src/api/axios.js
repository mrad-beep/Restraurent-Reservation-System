import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || ""https://restaurant-backend.onrender.com/api"",
});

// Attach the JWT token (if present) to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
