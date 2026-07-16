import axios from 'axios';
import { API_V1 } from '../config/api';

const DEFAULT_TIMEOUT_MS = 8000;

const client = axios.create({
  baseURL: API_V1,
  timeout: DEFAULT_TIMEOUT_MS,
});

export async function getOccupancySpaces() {
  const { data } = await client.get('/ocupacion/spaces');
  return data;
}

export async function getOccupancyBySpace(spaceId) {
  const { data } = await client.get(`/ocupacion/spaces/${spaceId}`);
  return data;
}