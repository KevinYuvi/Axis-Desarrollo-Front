const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function leerRespuestaSegura(response) {
  const rawText = await response.text();

  if (!rawText) return null;

  try {
    return JSON.parse(rawText);
  } catch {
    return { detail: rawText };
  }
}

async function fetchEstudiante(endpoint) {
  if (!API_URL) {
    throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await leerRespuestaSegura(response);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        'No se pudo obtener la información del estudiante.'
    );
  }

  return data;
}

export async function obtenerMisClasesHoy() {
  return fetchEstudiante('/api/v1/estudiantes/mis-clases-hoy');
}

export async function obtenerProximaClase() {
  return fetchEstudiante('/api/v1/estudiantes/proxima-clase');
}