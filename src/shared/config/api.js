// URL base del backend AXIS. Configurable por entorno vía EXPO_PUBLIC_API_URL:
// - Emulador Android: http://10.0.2.2:8000
// - Dispositivo físico: http://<IP-de-tu-PC>:8000 (misma WiFi; ver ipconfig)
// - expo start --web / iOS simulator: http://localhost:8000
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
export const API_V1 = `${API_URL}/api/v1`;

// Compatibilidad con imports existentes que esperaban la base con /api
export const API_BASE_URL = API_V1;
