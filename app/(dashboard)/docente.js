import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import DocenteHomeScreen from '../../src/modules/docente/presentation/screens/DocenteHomeScreen';

export default function DocenteRoute() {
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
  return <DocenteHomeScreen token={token} />;
}
