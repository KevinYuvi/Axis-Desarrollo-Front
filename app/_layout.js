import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import { useAuth, useUser, initMockSession } from '../src/shared/hooks/useClerkOrMock';
import { Text, View, ActivityIndicator } from 'react-native';
import { tokenCache } from '../utils/tokenCache';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

const InitialLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Si Clerk aún no termina de cargar la información, no hacemos nada
    if (!isLoaded) return;

    // Verificamos en qué grupo de pantallas está el usuario
    const inDashboardGroup = segments[0] === '(dashboard)';
    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && !inDashboardGroup) {
      // Con sesión activa, el admin va a su panel, el resto al index que es un enrutador inteligente
      const rol = user?.publicMetadata?.rol?.toLowerCase() ?? 'estudiante';
      if (rol === 'admin') {
        router.replace('/(dashboard)/admin');
      } else {
        router.replace('/(dashboard)');
      }
    } else if (!isSignedIn && !inAuthGroup) {
      // Si NO tiene sesión y NO está en el login/registro, lo mandamos al splash de selección de rol
      router.replace('/(auth)/splash');
    }
  }, [isSignedIn, isLoaded, segments, user]);

  return <Slot />;
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initMockSession().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 18, textAlign: 'center', padding: 20 }}>
          Error CRÍTICO: No se encontró la llave pública de Clerk.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <InitialLayout />
    </ClerkProvider>
  );
}