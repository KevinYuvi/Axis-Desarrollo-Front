import React from 'react';

import BibliotecasMonitorScreen from '../../../../shared/components/BibliotecasMonitorScreen';

/**
 * Sección Bibliotecas del rol estudiante. La lógica y la UI viven en el
 * componente compartido BibliotecasMonitorScreen (la misma que usa el admin);
 * el estudiante solo ve las estadísticas de ocupación de la Biblioteca Cisco
 * (personas, puestos libres y capacidad) y el botón de ubicación — nunca la
 * cámara en vivo, que es exclusiva del rol admin (mostrarCamara omitido).
 */
export default function EstudianteBibliotecasScreen() {
  return <BibliotecasMonitorScreen rol="estudiante" />;
}
