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

function validarApiUrl() {
  if (!API_URL) {
    throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
  }
}

function construirHeaders(token, extra = {}) {
  const headers = {
    Accept: 'application/json',
    ...extra,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function resolverMensajeError(response, data, mensajeDefault) {
  if (response.status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.';
  }

  if (response.status === 403) {
    return 'No tienes permisos para acceder a esta información.';
  }

  return data?.detail || data?.message || mensajeDefault;
}

async function fetchEstudiante(endpoint, { token } = {}) {
  validarApiUrl();

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: construirHeaders(token),
  });

  const data = await leerRespuestaSegura(response);

  if (!response.ok) {
    throw new Error(
      resolverMensajeError(
        response,
        data,
        'No se pudo obtener la información del estudiante.'
      )
    );
  }

  return data;
}

export function obtenerApiUrl() {
  if (!API_URL) {
    throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
  }

  return API_URL;
}

export function construirUrlArchivo(url) {
  if (!url) return null;

  if (String(url).startsWith('http')) {
    return url;
  }

  const baseUrl = obtenerApiUrl();

  if (String(url).startsWith('/')) {
    return `${baseUrl}${url}`;
  }

  return `${baseUrl}/${url}`;
}

export async function obtenerMisClasesHoy({ token } = {}) {
  return fetchEstudiante('/api/v1/estudiantes/mis-clases-hoy', { token });
}

export async function obtenerProximaClase({ token } = {}) {
  return fetchEstudiante('/api/v1/estudiantes/proxima-clase', { token });
}

export async function obtenerClaseActual({ token } = {}) {
  return fetchEstudiante('/api/v1/estudiantes/clase-actual', { token });
}

export async function obtenerDetalleClase({ token, claseId } = {}) {
  return fetchEstudiante(`/api/v1/estudiantes/clases/${claseId}`, { token });
}

export async function obtenerMisReportes({ token } = {}) {
  return fetchEstudiante('/api/v1/estudiantes/mis-reportes', { token });
}

export async function crearReporteClaseActualEstudiante({
  token,
  descripcion,
  gravedad,
  imagenes = [],
}) {
  validarApiUrl();

  if (!token) {
    throw new Error('No se pudo obtener una sesión activa.');
  }

  const formData = new FormData();
  formData.append('descripcion', descripcion);
  formData.append('gravedad', gravedad || 'media');

  imagenes.forEach((imagen, index) => {
    if (!imagen?.uri) return;

    const extension = imagen.uri.split('.').pop() || 'jpg';
    const nombre = imagen.fileName || `reporte-${Date.now()}-${index}.${extension}`;
    const mimeType = imagen.mimeType || imagen.type || 'image/jpeg';

    formData.append('imagenes', {
      uri: imagen.uri,
      name: nombre,
      type: mimeType,
    });
  });

  const response = await fetch(
    `${API_URL}/api/v1/estudiantes/reportar-incidencia-actual`,
    {
      method: 'POST',
      headers: construirHeaders(token),
      body: formData,
    }
  );

  const data = await leerRespuestaSegura(response);

  if (!response.ok) {
    throw new Error(
      resolverMensajeError(response, data, 'No se pudo registrar el reporte.')
    );
  }

  return data;
}
