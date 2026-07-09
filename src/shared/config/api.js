// Configuración del backend de Axis.
//
// Expo en un celular físico (Expo Go / build de desarrollo) NO puede usar
// "localhost" para llegar al backend que corre en tu computadora: localhost
// desde el celular apunta al propio celular, no a tu PC.
//
// Para probar en un dispositivo físico:
// 1. Asegúrate de que el celular y la PC estén en la misma red WiFi.
// 2. Obtén la IP local (LAN) de tu PC:
//    - Windows: ejecuta `ipconfig` y busca "Dirección IPv4" (ej: 192.168.1.50)
//    - Mac/Linux: ejecuta `ifconfig` o `ip addr`
// 3. Reemplaza el valor de abajo por esa IP y el puerto del backend (8000).
//
// Si usas un emulador Android, puedes usar 10.0.2.2 en vez de la IP local.
const API_BASE_URL = 'http://10.35.217.131:8000/api';

export { API_BASE_URL };
