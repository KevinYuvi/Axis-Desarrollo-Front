import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';

// 🔴 REEMPLAZA ESTO CON LA IPV4 DE TU COMPUTADORA
// Ejemplo: 'http://192.168.1.15:8000/api/v1'
const API_URL = 'http://192.168.1.8:8000/api/v1'; 

export const useApi = () => {
  const { getToken } = useAuth();

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor: Antes de que salga cualquier petición, le pegamos el Token de Clerk
  api.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Error obteniendo token de Clerk:", error);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return api;
};