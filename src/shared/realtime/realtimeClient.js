const API_URL = process.env.EXPO_PUBLIC_API_URL;

function obtenerRealtimeUrl() {
  if (!API_URL) {
    throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
  }

  const wsBaseUrl = API_URL
    .replace('http://', 'ws://')
    .replace('https://', 'wss://');

  return `${wsBaseUrl}/api/v1/realtime/ws`;
}

export function crearConexionRealtime({ onEvento, onError } = {}) {
  let socket = null;
  let cerradoManual = false;
  let reconectarTimer = null;

  const conectar = () => {
    try {
      const wsUrl = obtenerRealtimeUrl();

      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('Realtime conectado');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (onEvento) {
            onEvento(data);
          }
        } catch (error) {
          console.log('Evento realtime inválido:', error);
        }
      };

      socket.onerror = (error) => {
        console.log('Error realtime:', error);

        if (onError) {
          onError(error);
        }
      };

      socket.onclose = () => {
        console.log('Realtime cerrado');

        if (!cerradoManual) {
          reconectarTimer = setTimeout(() => {
            conectar();
          }, 3000);
        }
      };
    } catch (error) {
      console.log('No se pudo conectar realtime:', error);

      if (onError) {
        onError(error);
      }
    }
  };

  conectar();

  return {
    cerrar: () => {
      cerradoManual = true;

      if (reconectarTimer) {
        clearTimeout(reconectarTimer);
      }

      if (socket) {
        socket.close();
      }
    },
  };
}