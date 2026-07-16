import React, { createContext, useCallback, useEffect, useState } from 'react';
import { getOccupancySpaces } from '../services/occupancyApi';

const TYPE_LABELS = {
  library: 'Biblioteca',
  study_room: 'Sala de estudio',
  computer_lab: 'Laboratorio',
};

const POLL_INTERVAL_MS = 10000;

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
    lat: space.latitude,
    lng: space.longitude,
    resources: [
      space.studyRoomsTotal > 0 ? 'salas' : null,
      space.computersTotal > 0 ? 'computadores' : null,
      'WiFi',
    ].filter(Boolean),
    raw: space,
  };
}

function buildSummary(rawSpaces) {
  const conDatos = rawSpaces.filter(
    (s) => s.occupancyPercent !== null && s.occupancyPercent !== undefined
  );

  return {
    tables: conDatos.reduce((sum, s) => sum + (s.freeSeats || 0), 0),
    computers: conDatos.reduce((sum, s) => sum + (s.computersAvailable || 0), 0),
    rooms: conDatos.reduce((sum, s) => sum + (s.studyRoomsAvailable || 0), 0),
  };
}

function getBestRecommendation(spaces) {
  const candidates = spaces.filter(
    (item) =>
      item.occupancyPercent !== null &&
      item.occupancyPercent !== undefined &&
      item.status !== 'Ocupado' &&
      item.status !== 'Sin datos'
  );

  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const occupancyA = a.occupancyPercent ?? 100;
    const occupancyB = b.occupancyPercent ?? 100;

    if (occupancyA !== occupancyB) return occupancyA - occupancyB;

    return (a.distanceMinutes || 999) - (b.distanceMinutes || 999);
  });

  return candidates[0];
}

const EMPTY_SUMMARY = { tables: 0, computers: 0, rooms: 0 };

export const OccupancyContext = createContext(null);

export function OccupancyProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    spaces: [],
    summary: EMPTY_SUMMARY,
    recommendation: null,
  });

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setState((prev) => ({ ...prev, loading: true }));
    }

    try {
      const spacesRes = await getOccupancySpaces();
      const rawSpaces = Array.isArray(spacesRes?.data) ? spacesRes.data : [];

      setState({
        loading: false,
        spaces: rawSpaces.map(mapSpace),
        summary: buildSummary(rawSpaces),
        recommendation: getBestRecommendation(rawSpaces),
      });
    } catch (error) {
      console.error('Error cargando ocupación:', error);

      setState({
        loading: false,
        spaces: [],
        summary: EMPTY_SUMMARY,
        recommendation: null,
      });
    }
  }, []);

  useEffect(() => {
    load();

    const intervalId = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [load]);

  const contextValue = {
    ...state,
    reload: load,
  };

  return (
    <OccupancyContext.Provider value={contextValue}>
      {children}
    </OccupancyContext.Provider>
  );
}