import { useLocalSearchParams, useRouter } from 'expo-router';

import CameraTrackingScreen from '../../../src/modules/camera/presentation/screens/CameraTrackingScreen';
import { OccupancyProvider } from '../../../src/shared/context/OccupancyContext';

/**
 * Ruta EXCLUSIVA del rol admin: cámara en tiempo real de la biblioteca
 * (stream MJPEG de la cámara IP + último análisis de la visión IA + estado
 * de ocupación). Vive dentro del grupo (admin), por lo que el guard de roles
 * de app/_layout.js redirige a cualquier otro rol que intente entrar.
 */
export default function BibliotecaCamaraAdminRoute() {
  const router = useRouter();
  const { spaceId } = useLocalSearchParams();

  return (
    <OccupancyProvider>
      <CameraTrackingScreen
        spaceId={spaceId}
        rol="admin"
        onNavigate={() => router.push('/(admin)/bibliotecas')}
      />
    </OccupancyProvider>
  );
}
