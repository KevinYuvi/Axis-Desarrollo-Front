// Configuración de la cámara IP que simula la vigilancia de la biblioteca.
//
// La app "IP Webcam" (Android) convierte el celular en una cámara accesible
// por WiFi. Al iniciar su servidor muestra una URL como
// "http://192.168.1.23:8080" — usa esa IP aquí, agregando "/video" para el
// stream en vivo.
//
// 1. Asegúrate de que este celular esté en la MISMA red WiFi que la PC
//    donde corre el backend y que el celular con Expo Go.
// 2. Abre la app IP Webcam, presiona "Iniciar servidor" y anota la IP.
// 3. Reemplaza el valor de abajo por esa IP (mismo puerto, 8080 por defecto).
const CAMERA_STREAM_URL = 'http://192.168.100.82:8080/video';

// Id del único espacio que hoy tiene una cámara real conectada (ver plan de
// implementación en docs/.plans/260708-1317-camera-tracking-realtime/). Los
// demás espacios muestran un mensaje de "sin cámara".
const LIVE_CAMERA_SPACE_ID = 'biblioteca-fica';

/**
 * Indica si el espacio dado tiene una cámara real conectada en esta fase.
 * @param {string} spaceId - Identificador del espacio a verificar
 * @returns {boolean} true si el espacio tiene cámara en vivo disponible
 */
function hasLiveCamera(spaceId) {
  return spaceId === LIVE_CAMERA_SPACE_ID;
}

export { CAMERA_STREAM_URL, LIVE_CAMERA_SPACE_ID, hasLiveCamera };
