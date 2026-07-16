import { useLocalSearchParams } from 'expo-router';

import RutaBibliotecaScreen from '../../../src/shared/components/RutaBibliotecaScreen';
import { OccupancyProvider } from '../../../src/shared/context/OccupancyContext';

/**
 * Ruta del admin hacia la ubicación de una biblioteca (botón "Ver ubicación"
 * de la sección Bibliotecas). Reutiliza la misma pantalla compartida que el
 * estudiante, solo cambia el rol del header.
 */
export default function BibliotecaUbicacionAdminRoute() {
  const { spaceId } = useLocalSearchParams();

  return (
    <OccupancyProvider>
      <RutaBibliotecaScreen spaceId={spaceId} rol="admin" />
    </OccupancyProvider>
  );
}
