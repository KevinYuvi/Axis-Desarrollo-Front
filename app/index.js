import { View, ActivityIndicator } from 'react-native';
import { useUser } from '../src/shared/hooks/useClerkOrMock';
import { Redirect } from 'expo-router';

export default function StartPage() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }
  if (!isSignedIn) return <Redirect href="/(auth)/login" />;

  const rol = user?.publicMetadata?.rol?.toLowerCase() ?? 'estudiante';
  if (rol === 'admin') return <Redirect href="/(dashboard)/admin" />;
  // estudiante, docente y ayudante entran al index del dashboard
  return <Redirect href="/(dashboard)" />;
}
