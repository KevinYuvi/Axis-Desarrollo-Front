import React, { createContext, useCallback, useEffect, useState } from 'react';
import { analyzeOccupancyByVision, getOccupancySpaces, getOccupancyRecommendation } from '../services/occupancyApi';
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

export const OccupancyContext = createContext(null);

/**
 * Provee el estado de ocupación (espacios, resumen, recomendación) a toda la
 * app desde un único punto de carga. Evita que cada pantalla (Inicio,
 * Bibliotecas) vuelva a consultar el backend al navegar entre ellas.
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
  const [analyzingId, setAnalyzingId] = useState(null);

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

  /**
   * Solicita el análisis por visión IA de un espacio y actualiza esa entrada
   * dentro de la lista de espacios sin afectar al resto del estado
   * @param {string} spaceId - Identificador del espacio a analizar
   * @returns {Promise<Object>} Resultado con el desenlace para mostrar el mensaje adecuado en la UI
   */
  const analyzeSpace = useCallback(async (spaceId) => {
    setAnalyzingId(spaceId);

    try {
      const { data: updatedSpace } = await analyzeOccupancyByVision(spaceId);
      const mappedSpace = mapSpace(updatedSpace);

      setState((prev) => ({
        ...prev,
        spaces: prev.spaces.map((space) => (space.id === spaceId ? mappedSpace : space)),
      }));

      const isVisionSource = updatedSpace.source === 'vision-service';
      return {
        ok: true,
        isVisionSource,
        message: isVisionSource
          ? 'Ocupación actualizada con visión IA'
          : 'Mostrando datos simulados por falta de conexión con visión IA',
      };
    } catch (error) {
      return {
        ok: false,
        isVisionSource: false,
        message: 'No se pudo actualizar la ocupación. Intenta de nuevo.',
      };
    } finally {
      setAnalyzingId(null);
    }
  }, []);

  const contextValue = { ...state, analyzingId, analyzeSpace, reload: load };

  return <OccupancyContext.Provider value={contextValue}>{children}</OccupancyContext.Provider>;
}
