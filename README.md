# Axis — Aplicación móvil

Aplicación móvil del sistema **Axis**, un Smart Campus para la Universidad Central del Ecuador: muestra en tiempo real la ocupación de bibliotecas y espacios de estudio (calculada con visión artificial en el backend), permite ver el video en vivo de la cámara de un espacio, ubicar edificios en el mapa del campus y obtener rutas de cómo llegar.

Construida con **Expo / React Native**. Requiere el backend de [Axis-Desarrollo-Backend](https://github.com/KevinYuvi/Axis-Desarrollo-Backend) corriendo en la misma red.

---

## Stack y por qué

- **Expo (React Native):** permite desarrollar y probar la app en un celular físico real con solo escanear un QR (Expo Go), sin compilar binarios nativos ni configurar Android Studio. Para un equipo que itera rápido sobre dispositivos propios, es la fricción mínima posible.
- **expo-router:** navegación basada en archivos — cada archivo dentro de `app/` es una ruta. Los grupos `(auth)` y `(dashboard)` separan el flujo de sesión del flujo interno, y la redirección por rol queda declarada en un solo lugar (`app/_layout.js`).
- **Clerk (`@clerk/clerk-expo`):** gestiona registro, verificación de correo, sesiones y 2FA de dispositivo nuevo sin que tengamos que operar nuestra propia infraestructura de autenticación. El backend verifica los tokens con la llave pública de la misma instancia, de modo que la sesión es válida de punta a punta. La regla de negocio de login institucional (`@uce.edu.ec`) se valida en las pantallas de auth.
- **react-native-maps + maps-directions (Google Maps):** mapa del campus y trazado de rutas hacia los edificios ("Cómo llegar").
- **react-native-webview:** reproduce el stream MJPEG de la cámara IP directamente desde el celular-cámara. El video **no pasa por el backend** — la app se conecta directo por WiFi, por eso se ve fluido y en vivo.
- **axios:** cliente HTTP centralizado en `src/shared/services`, con la URL base tomada de variables de entorno.

## Arquitectura del código

El proyecto sigue una separación por **módulos de funcionalidad** con presentación al estilo **Atomic Design**:

```
Axis-Desarrollo-Front/
├── app/                        # Rutas (expo-router)
│   ├── (auth)/                 # login, registro, verificación
│   ├── (dashboard)/            # pantallas internas, agrupadas por rol
│   ├── _layout.js              # Providers globales + redirección por rol
│   └── index.js                # Entrada: decide a dónde va cada rol
├── src/
│   ├── modules/                # Un módulo por funcionalidad
│   │   ├── student/            #   pantallas del estudiante (bibliotecas, home)
│   │   ├── camera/             #   cámara en vivo + análisis IA
│   │   └── .../                #   docente, ayudante, etc.
│   └── shared/                 # Todo lo transversal
│       ├── components/         #   componentes reutilizables (barrel export)
│       ├── config/             #   api.js, camera.js (leen el .env)
│       ├── context/            #   OccupancyContext (polling de ocupación)
│       ├── hooks/              #   useOccupancy y otros
│       ├── services/           #   clientes HTTP (occupancyApi, ...)
│       └── theme/              #   colores, estilos compartidos
```

**Por qué así:** las rutas (`app/`) solo deciden *qué* pantalla mostrar; la lógica y la UI de cada pantalla viven en su módulo (`src/modules/*`), y nada se duplica porque lo transversal (tema, componentes, clientes de API) está en `src/shared`. Esto mantiene la interfaz consistente entre roles — todos consumen los mismos componentes y tokens de tema — y permite trabajar en un módulo sin pisar el código de otro.

**Datos de ocupación:** `OccupancyContext` consulta al backend cada **10 segundos** (el mismo ritmo con el que el vision-service analiza la cámara) y todas las pantallas leen de ese contexto único vía `useOccupancy()`. Un solo polling para toda la app.

---

## Requisitos previos

- **Node.js LTS** y **npm**
- Celular Android con **Expo Go** (Play Store)
- El **backend corriendo** (API en Docker + vision-service local) — ver el README del repositorio del backend
- Para el video en vivo: un segundo celular con la app **IP Webcam** como cámara
- PC y celulares en la **misma red WiFi** (sin aislamiento de clientes; si la red institucional no lo permite, usar el hotspot de un celular)

## Puesta en marcha

### 1. Clonar e instalar

```bash
git clone https://github.com/KevinYuvi/Axis-Desarrollo-Front.git
cd Axis-Desarrollo-Front
npm install
```

### 2. Configurar variables de entorno

```bash
copy .env.example .env
```

| Variable | Qué es | Valor |
|---|---|---|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Llave pública de Clerk | Dashboard de Clerk del equipo → API Keys |
| `EXPO_PUBLIC_GOOGLE_MAPS_APIKEY` | Llave de Google Maps | Consola de Google Cloud del equipo |
| `EXPO_PUBLIC_API_URL` | URL del backend | `http://<IP-de-tu-PC>:8000` en celular físico (ver `ipconfig`); `http://10.0.2.2:8000` en emulador Android |
| `EXPO_PUBLIC_CAMERA_STREAM_URL` | Stream de la cámara IP | `http://<IP-del-celular-cámara>:8080/video` (la IP la muestra IP Webcam al iniciar su servidor) |

> Las variables `EXPO_PUBLIC_*` se incrustan en la app cuando Metro arranca: **después de cambiar el `.env` hay que reiniciar con `npx expo start -c`**, o el cambio no se aplica.

### 3. Ejecutar

```bash
npx expo start
```

Escanear el QR con Expo Go. La primera carga del bundle tarda unos segundos.

### 4. Crear una cuenta

En la pantalla de login, tocar **Regístrate** y usar un correo institucional real (`@uce.edu.ec`) — Clerk envía un código de verificación a ese buzón. La contraseña debe tener al menos 8 caracteres. Las cuentas nuevas entran con rol **estudiante**; los roles `docente`, `admin` y `ayudante` se asignan desde el dashboard de Clerk (`publicMetadata.rol` del usuario).

## Probar la cámara en vivo

1. En el celular-cámara, abrir IP Webcam y tocar **Iniciar servidor**. Confirmar que la IP coincide con la del `.env` (si cambió, actualizar `.env` y reiniciar con `-c`).
2. En la app, ir a **Bibliotecas → Biblioteca FICA → Ver detalle** (es el único espacio con cámara real conectada).
3. Debe verse el video en vivo y, debajo, la sección **"Último análisis con IA (cada 10 s)"** con la foto anotada por YOLO (recuadros sobre las personas detectadas).
4. Pararse frente a la cámara y esperar 10–20 segundos: el conteo de personas, el porcentaje de ocupación y la recomendación se actualizan solos.
5. Resiliencia: apagar el vision-service o la cámara no rompe la app — cae a datos simulados y se recupera sola al volver a encenderlos.

## Solución de problemas

- **"Couldn't find your account" al iniciar sesión:** esa cuenta no existe en la instancia de Clerk del equipo. Crearla desde **Regístrate**.
- **`Network Error` en la consola de Metro:** `EXPO_PUBLIC_API_URL` no apunta a la IP correcta de la PC, el backend no corre con `--host 0.0.0.0`, o el Firewall de Windows bloquea el puerto 8000.
- **La pantalla de la cámara se ve negra:** la IP del celular-cámara cambió (IP Webcam la muestra al iniciar el servidor). Actualizar `EXPO_PUBLIC_CAMERA_STREAM_URL` y reiniciar con `npx expo start -c`.
- **Cambié el `.env` y no pasa nada:** reiniciar Metro con `npx expo start -c` — las variables se leen solo al arrancar.
- **La imagen anotada no aparece:** el vision-service no está corriendo, o todavía no completa su primer ciclo (hasta 10 segundos tras arrancar).
