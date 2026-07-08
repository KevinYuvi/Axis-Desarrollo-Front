import { useState } from 'react';
import { Alert } from 'react-native';
import { LoginScreen } from './src/modules/auth';
import { StudentHomeScreen, LibrariesScreen } from './src/modules/student';
import DocenteHomeScreen from './src/modules/docente/presentation/screens/DocenteHomeScreen';
import { iniciarSesionAPI } from './src/services/authService';

// Función auxiliar para decodificar el Payload del JWT
const decodificarJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [tokenUsuario, setTokenUsuario] = useState(null);

  // Manejador del Login Real conectado al Backend
  const handleLoginSubmit = async (email, password) => {
    try {
      // 1. Llamamos a la API de FastAPI
      const respuesta = await iniciarSesionAPI(email, password);
      const token = respuesta.access_token;
      
      // 2. Extraemos los datos del Payload del Token
      const datosToken = decodificarJWT(token);
      
      if (!datosToken || !datosToken.rol) {
        Alert.alert("Error", "El token no contiene un rol válido.");
        return;
      }

      // 3. Guardamos el token en el estado (idealmente luego irá a AsyncStorage)
      setTokenUsuario(token);

      // 4. Redirección inteligente basada en el rol del backend
      const rol = datosToken.rol.toLowerCase();
      if (rol === 'profesor' || rol === 'docente' || rol === 'ayudante') {
        setCurrentScreen('docenteHome');
      } else if (rol === 'estudiante') {
        setCurrentScreen('studentHome');
      } else {
        Alert.alert("Acceso Restringido", "Tu rol no tiene una pantalla asignada.");
      }

    } catch (error) {
      Alert.alert("Error de Autenticación", error.message || "Contraseña o correo incorrectos");
    }
  };

  // --- Sistema de Renderizado de Pantallas ---
  if (currentScreen === 'docenteHome') {
    return <DocenteHomeScreen onNavigate={setCurrentScreen} token={tokenUsuario} />;
  }

  if (currentScreen === 'studentHome') {
    return <StudentHomeScreen onNavigate={setCurrentScreen} token={tokenUsuario} />;
  }

  if (currentScreen === 'libraries') {
    return <LibrariesScreen onNavigate={setCurrentScreen} />;
  }

  // Le pasamos la función manejadora a tu componente de Login existente
  return (
    <LoginScreen 
      onLoginSubmit={handleLoginSubmit} 
      onDemoAccess={() => setCurrentScreen('studentHome')} 
    />
  );
}