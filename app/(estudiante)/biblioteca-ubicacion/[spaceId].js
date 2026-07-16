import { useLocalSearchParams } from 'expo-router';

import RutaBibliotecaScreen from '../../../src/shared/components/RutaBibliotecaScreen';
import { OccupancyProvider } from '../../../src/shared/context/OccupancyContext';

/**
 * Ruta del estudiante hacia la ubicación de una biblioteca (botón
 * "Ver ubicación" de la sección Bibliotecas). Se envuelve en
 * OccupancyProvider porque las coordenadas del espacio vienen del
 * backend de ocupación.
 */
export default function BibliotecaUbicacionRoute() {
  const { spaceId } = useLocalSearchParams();

  return (
    <OccupancyProvider>
      <RutaBibliotecaScreen spaceId={spaceId} rol="estudiante" />
    </OccupancyProvider>
  );
}
