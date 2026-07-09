import axios from 'axios';
import { API_V1 } from '../config/api';

// Las consultas mock (spaces/recommendation) son instantáneas en el backend;
// este timeout solo cubre latencia de red normal en la misma WiFi.
const DEFAULT_TIMEOUT_MS = 8000;

const client = axios.create({
  baseURL: API_V1,
  timeout: DEFAULT_TIMEOUT_MS,
});

/**
 * Obtiene la lista completa de espacios de estudio con su ocupación simulada
 * @returns {Promise<Object>} Promesa que resuelve con los datos de respuesta del API
 */
export async function getOccupancySpaces() {
  const { data } = await client.get('/ocupacion/spaces');
  return data;
}

/**
 * Obtiene el detalle de ocupación de un espacio específico mediante su ID
 * @param {string} spaceId - Identificador único del espacio
 * @returns {Promise<Object>} Promesa que resuelve con los datos de respuesta del API
 */
export async function getOccupancyBySpace(spaceId) {
  const { data } = await client.get(`/ocupacion/spaces/${spaceId}`);
  return data;
}

/**
 * Obtiene una recomendación inteligente del mejor espacio disponible
 * @returns {Promise<Object>} Promesa que resuelve con la recomendación sugerida
 */
export async function getOccupancyRecommendation() {
  const { data } = await client.get('/ocupacion/recommendation');
  return data;
}
