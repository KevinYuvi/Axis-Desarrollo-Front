import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import AsistenteIAScreen from '../../src/modules/docente/presentation/screens/AsistenteIAScreen';

export default function AsistenteRoute() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [token, setToken] = useState(null);

  useEffect(() => {
    let activo = true;
    getToken().then((t) => activo && setToken(t));
    return () => {
      activo = false;
    };
  }, [getToken]);

  if (!token) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }
  return (
    <AsistenteIAScreen
      token={token}
      onBack={() => (router.canGoBack() ? router.back() : router.push('/(dashboard)'))}
      onVerReportes={() => router.push('/(dashboard)/reportes')}
    />
  );
}
