import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Las consultas mock (spaces/recommendation) son instantáneas en el backend;
// este timeout solo cubre latencia de red normal en la misma WiFi.
const DEFAULT_TIMEOUT_MS = 8000;

// El análisis con visión IA puede tardar más que una consulta normal porque
// implica una inferencia real de YOLO (y, en frío, carga del modelo).
const ANALYZE_TIMEOUT_MS = 20000;

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
});

/**
 * Obtiene la lista completa de espacios de estudio con su ocupación simulada
 * @returns {Promise<Object>} Promesa que resuelve con los datos de respuesta del API
 */
export async function getOccupancySpaces() {
  const { data } = await client.get('/occupancy/spaces');
  return data;
}

/**
 * Obtiene el detalle de ocupación de un espacio específico mediante su ID
 * @param {string} spaceId - Identificador único del espacio
 * @returns {Promise<Object>} Promesa que resuelve con los datos de respuesta del API
 */
export async function getOccupancyBySpace(spaceId) {
  const { data } = await client.get(`/occupancy/spaces/${spaceId}`);
  return data;
}

/**
 * Obtiene una recomendación inteligente del mejor espacio disponible
 * @returns {Promise<Object>} Promesa que resuelve con la recomendación sugerida
 */
export async function getOccupancyRecommendation() {
  const { data } = await client.get('/occupancy/recommendation');
  return data;
}

/**
 * Solicita al backend analizar un espacio mediante el vision-service (Fase 2)
 * @param {string} spaceId - Identificador único del espacio a analizar
 * @returns {Promise<Object>} Promesa que resuelve con los datos actualizados del espacio
 */
export async function analyzeOccupancyByVision(spaceId) {
  const { data } = await client.post(`/occupancy/spaces/${spaceId}/analyze`, undefined, {
    timeout: ANALYZE_TIMEOUT_MS,
  });
  return data;
}
