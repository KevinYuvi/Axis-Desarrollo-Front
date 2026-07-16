import EstudianteBibliotecasScreen from '../../src/modules/estudiante/presentation/screens/EstudianteBibliotecasScreen';
import { OccupancyProvider } from '../../src/shared/context/OccupancyContext';

export default function BibliotecasRoute() {
  return (
    <OccupancyProvider>
      <EstudianteBibliotecasScreen />
    </OccupancyProvider>
  );
}