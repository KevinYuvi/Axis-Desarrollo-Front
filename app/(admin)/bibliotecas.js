import AdminBibliotecasScreen from '../../src/modules/admin/presentation/screens/AdminBibliotecasScreen';
import { OccupancyProvider } from '../../src/shared/context/OccupancyContext';

/**
 * Ruta de la sección Bibliotecas para el rol admin: estadísticas de la
 * Biblioteca Cisco (personas, puestos libres y capacidad) más el acceso a la
 * cámara en tiempo real, alimentadas por el OccupancyProvider (polling al
 * backend de ocupación).
 */
export default function AdminBibliotecasRoute() {
  return (
    <OccupancyProvider>
      <AdminBibliotecasScreen />
    </OccupancyProvider>
  );
}
