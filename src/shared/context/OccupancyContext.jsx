import React, { createContext, useCallback, useEffect, useState } from 'react';
import { getOccupancySpaces, getOccupancyRecommendation } from '../services/occupancyApi';
import { librariesMock, summaryMock, recommendedSpaceMock } from '../mocks/spacesMock';

const TYPE_LABELS = {
  library: 'Biblioteca',
  study_room: 'Sala de estudio',
  computer_lab: 'Laboratorio',
};

// Cada cuánto se refresca la ocupación en segundo plano (Fase 3 — el
// vision-service ya analiza automáticamente con este mismo intervalo).
const POLL_INTERVAL_MS = 30000;

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

export const OccupancyContext = createContext(null);

/**
 * Provee el estado de ocupación (espacios, resumen, recomendación) a toda la
 * app desde un único punto de carga, refrescado automáticamente cada
 * POLL_INTERVAL_MS (Fase 3 — ya no depende de que el usuario toque un botón).
 * @param {Object} props
 * @param {React.ReactNode} props.children - Árbol de la app que consumirá el contexto
 */
export function OccupancyProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    isFallback: false,
    spaces: [],
    summary: summaryMock,
    recommendation: null,
  });

  /**
   * Carga los espacios y recomendación de ocupación desde el API.
   * En refrescos automáticos (silent) no reactiva el loader de pantalla
   * completa, para no interrumpir al usuario cada 30 segundos.
   * @param {Object} [options]
   * @param {boolean} [options.silent] - Si es true, no muestra el loader de carga
   */
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setState((prev) => ({ ...prev, loading: true }));
    }

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

    const intervalId = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [load]);

  const contextValue = { ...state, reload: load };

  return <OccupancyContext.Provider value={contextValue}>{children}</OccupancyContext.Provider>;
}
