import React from 'react';

import BibliotecasMonitorScreen from '../../../../shared/components/BibliotecasMonitorScreen';

/**
 * Sección Bibliotecas del rol admin. Reutiliza el mismo componente compartido
 * que el estudiante (BibliotecasMonitorScreen) para ver las estadísticas de
 * la Biblioteca Cisco (personas, puestos libres y capacidad) y el botón de
 * ubicación, pero con mostrarCamara habilitado: solo el admin puede abrir la
 * cámara en tiempo real del espacio.
 */
export default function AdminBibliotecasScreen() {
  return <BibliotecasMonitorScreen rol="admin" mostrarCamara />;
}
