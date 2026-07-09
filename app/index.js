import { View, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
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
  if (rol === 'docente') return <Redirect href="/(dashboard)/docente" />;
  if (rol === 'admin') return <Redirect href="/(dashboard)/admin" />;
  // estudiante y ayudante entran al home general
  return <Redirect href="/(dashboard)" />;
}
