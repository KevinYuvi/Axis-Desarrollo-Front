import { useCallback, useEffect, useState } from 'react';
import { getOccupancySpaces, getOccupancyRecommendation } from '../services/occupancyApi';
import { librariesMock, summaryMock, recommendedSpaceMock } from '../mocks/spacesMock';

const TYPE_LABELS = {
  library: 'Biblioteca',
  study_room: 'Sala de estudio',
  computer_lab: 'Laboratorio',
};

/**
 * Mapea los datos del espacio devueltos por el API al formato requerido por las vistas
 * @param {Object} space - Datos crudos del espacio provenientes del API
 * @returns {Object} Datos formateados del espacio
 */
function mapSpace(space) {
  return {
    id: space.id,
    name: space.name,
    type: TYPE_LABELS[space.type] || space.type,
    status: space.status,
    occupancy: space.occupancyPercent,
    availableTables: space.freeSeats,
    availableComputers: space.computersAvailable,
    distanceTime: `${space.distanceMinutes} min`,
    resources: [
      space.studyRoomsTotal > 0 ? 'salas' : null,
      space.computersTotal > 0 ? 'computadores' : null,
      'WiFi',
    ].filter(Boolean),
    raw: space,
  };
}

/**
 * Construye un resumen total de ocupación sumando los recursos de todos los espacios
 * @param {Array<Object>} rawSpaces - Lista de espacios crudos provenientes del API
 * @returns {Object} Resumen con el conteo de mesas, computadoras y salas libres
 */
function buildSummary(rawSpaces) {
  const conDatos = rawSpaces.filter((s) => s.occupancyPercent !== null && s.occupancyPercent !== undefined);
  return {
    tables: conDatos.reduce((sum, s) => sum + (s.freeSeats || 0), 0),
    computers: conDatos.reduce((sum, s) => sum + (s.computersAvailable || 0), 0),
    rooms: conDatos.reduce((sum, s) => sum + (s.studyRoomsAvailable || 0), 0),
  };
}

const FALLBACK_RECOMMENDATION = {
  space: {
    ...recommendedSpaceMock,
    freeSeats: recommendedSpaceMock.availableTables,
    computersAvailable: 0,
    distanceMinutes: parseInt(recommendedSpaceMock.distanceTime, 10) || 0,
  },
  reason: `${recommendedSpaceMock.name} · ${recommendedSpaceMock.occupancy}% ocupación · ${recommendedSpaceMock.availableTables} mesas libres · a ${recommendedSpaceMock.distanceTime}`,
  confidence: null,
};

/**
 * Hook personalizado para manejar el estado y llamadas al API de ocupación
 * Maneja automáticamente casos de fallback en caso de fallas de conexión al backend
 * @returns {Object} Estado de ocupación incluyendo carga, fallback, resumen, espacios y recomendación
 */
export function useOccupancy() {
  const [state, setState] = useState({
    loading: true,
    isFallback: false,
    spaces: [],
    summary: summaryMock,
    recommendation: null,
  });

  /**
   * Carga los espacios y recomendación de ocupación desde el API
   */
  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const [spacesRes, recommendationRes] = await Promise.all([
        getOccupancySpaces(),
        getOccupancyRecommendation(),
      ]);
      const rawSpaces = spacesRes.data;

      setState({
        loading: false,
        isFallback: false,
        spaces: rawSpaces.map(mapSpace),
        summary: buildSummary(rawSpaces),
        recommendation: recommendationRes.data,
      });
    } catch (error) {
      setState({
        loading: false,
        isFallback: true,
        spaces: librariesMock,
        summary: summaryMock,
        recommendation: FALLBACK_RECOMMENDATION,
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
