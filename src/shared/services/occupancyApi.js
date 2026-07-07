import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
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
