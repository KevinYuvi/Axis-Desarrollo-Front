import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '../../src/shared/hooks/useClerkOrMock';
import { colors } from '../../src/shared/theme/colors';

import StudentHomeScreen from '../../src/modules/student/presentation/screens/StudentHomeScreen';
import DocenteHomeScreen from '../../src/modules/docente/presentation/screens/DocenteHomeScreen';
import AyudanteHomeScreen from '../../src/modules/assistant/presentation/screens/AyudanteHomeScreen';

// Mapea los nombres de tab del BottomTabBar legacy a rutas de expo-router (para Estudiante)
const TAB_ROUTES = {
  home: '/(dashboard)',
  libraries: '/(dashboard)/bibliotecas',
  assistant: '/(dashboard)/asistente',
};

export default function DashboardIndexRoute() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [token, setToken] = React.useState(null);

  React.useEffect(() => {
    let activo = true;
    getToken().then((t) => activo && setToken(t));
    return () => { activo = false; };
  }, [getToken]);

  if (!isLoaded || !token) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'estudiante';

  if (rol === 'docente') {
    return <DocenteHomeScreen token={token} />;
  }

  if (rol === 'ayudante') {
    return <AyudanteHomeScreen rol={rol} />;
  }

  // Estudiante (default)
  return (
    <StudentHomeScreen
      onNavigate={(tab) => router.push(TAB_ROUTES[tab] ?? '/(dashboard)')}
      onNavigateToCamera={(spaceId) =>
        router.push({ pathname: '/(dashboard)/camara', params: { spaceId } })
      }
    />
  );
}
