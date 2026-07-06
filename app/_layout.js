import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Text, View } from 'react-native';
import { tokenCache } from '../utils/tokenCache';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

const InitialLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Si Clerk aún no termina de cargar la información, no hacemos nada
    if (!isLoaded) return;

    // Verificamos en qué grupo de pantallas está el usuario
    const inDashboardGroup = segments[0] === '(dashboard)';
    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && !inDashboardGroup) {
      // Si tiene sesión activa y NO está en el dashboard, lo mandamos al dashboard
      router.replace('/(dashboard)');
    } else if (!isSignedIn && !inAuthGroup) {
      // Si NO tiene sesión y NO está en el login/registro, lo mandamos al login obligatoriamente
      router.replace('/(auth)/login');
    }
  }, [isSignedIn, isLoaded, segments]);

  return <Slot />;
};

export default function RootLayout() {
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