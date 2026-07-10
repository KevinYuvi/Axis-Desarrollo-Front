import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { colors } from '../../src/shared/theme/colors';
import UsuariosAdminScreen from '../../src/modules/admin/presentation/screens/UsuariosAdminScreen';

export default function AdminUsuariosRoute() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [token, setToken] = useState(null);

  useEffect(() => {
    let activo = true;
    getToken().then((t) => activo && setToken(t));
    return () => { activo = false; };
  }, [getToken]);

  if (!token) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <UsuariosAdminScreen
      token={token}
      onBack={() => (router.canGoBack() ? router.back() : router.push('/(dashboard)/admin'))}
    />
  );
}
