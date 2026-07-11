import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';

const RAW_CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

const CLERK_PUBLISHABLE_KEY = RAW_CLERK_KEY
  ? RAW_CLERK_KEY.trim().replace(/^['"]|['"]$/g, '')
  : '';

function normalizarRol(rolRaw) {
  const rol = String(rolRaw || 'estudiante').trim().toLowerCase();

  const alias = {
    profesor: 'docente',
    teacher: 'docente',
    gestor: 'admin',
    administrador: 'admin',
    soporte: 'ayudante',
  };

  return alias[rol] || rol;
}

function obtenerRutaPorRol(rolRaw) {
  const rol = normalizarRol(rolRaw);

  if (rol === 'docente') {
    return '/(docente)';
  }

  if (rol === 'admin') {
    return '/(admin)';
  }

  if (rol === 'ayudante') {
    return '/(ayudante)';
  }

  return '/(estudiante)';
}

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !userLoaded) return;

    const grupoActual = segments[0];

    const estaEnAuth = grupoActual === '(auth)';
    const estaEnDocente = grupoActual === '(docente)';
    const estaEnEstudiante = grupoActual === '(estudiante)';
    const estaEnAdmin = grupoActual === '(admin)';
    const estaEnAyudante = grupoActual === '(ayudante)';

    const estaEnGrupoProtegido =
      estaEnDocente || estaEnEstudiante || estaEnAdmin || estaEnAyudante;

    if (!isSignedIn) {
      if (!estaEnAuth) {
        router.replace('/(auth)/login');
      }

      return;
    }

    const rol =
      user?.publicMetadata?.rol ||
      user?.unsafeMetadata?.rol ||
      'estudiante';

    const rutaCorrecta = obtenerRutaPorRol(rol);

    const grupoCorrecto = rutaCorrecta.replace('/', '');

    if (estaEnAuth || !estaEnGrupoProtegido) {
      router.replace(rutaCorrecta);
      return;
    }

    if (grupoActual !== grupoCorrecto) {
      router.replace(rutaCorrecta);
    }
  }, [isLoaded, userLoaded, isSignedIn, user?.id, segments]);

  if (!isLoaded || !userLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#2F80ED" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error(
      'Falta EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY en el archivo .env del frontend.'
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <InitialLayout />
    </ClerkProvider>
  );
}