import { useContext } from 'react';
import { OccupancyContext } from '../context/OccupancyContext';

/**
 * Accede al estado compartido de ocupación (espacios, resumen, recomendación,
 * análisis por visión IA). Debe usarse dentro de un OccupancyProvider.
 * @returns {Object} Estado de ocupación: loading, isFallback, spaces, summary, recommendation, analyzingId, analyzeSpace, reload
 */
export function useOccupancy() {
  const context = useContext(OccupancyContext);

  if (!context) {
    throw new Error('useOccupancy debe usarse dentro de un OccupancyProvider');
  }

  return context;
}
