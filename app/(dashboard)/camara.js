import { useLocalSearchParams, useRouter } from 'expo-router';
import CameraTrackingScreen from '../../src/modules/camera/presentation/screens/CameraTrackingScreen';

const TAB_ROUTES = {
  home: '/(dashboard)',
  libraries: '/(dashboard)/bibliotecas',
  assistant: '/(dashboard)/asistente',
};

export default function CameraRoute() {
  const router = useRouter();
  const { spaceId } = useLocalSearchParams();
  return (
    <CameraTrackingScreen
      spaceId={spaceId}
      onNavigate={(tab) => router.push(TAB_ROUTES[tab] ?? '/(dashboard)')}
    />
  );
}
