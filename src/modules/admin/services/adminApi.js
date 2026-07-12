const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function fetchConToken(endpoint, token, options = {}) {
  if (!API_URL) {
    throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
  }

  if (!token) {
    throw new Error('No se encontró el token de sesión.');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const rawText = await response.text();

  let data = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(data?.detail || 'No se pudo completar la solicitud.');
  }

  return data;
}

export async function obtenerAulasAdmin(token) {
  return fetchConToken('/api/v1/espacios/', token);
}

export async function obtenerReservasAdmin(token) {
  return fetchConToken('/api/v1/reservas/', token);
}

export async function obtenerReportesAdmin(token) {
  return fetchConToken('/api/v1/reportes/', token);
}

export async function actualizarEstadoReporteAdmin(token, reporteId, nuevoEstado) {
  return fetchConToken(
    `/api/v1/reportes/${reporteId}/estado?nuevo_estado=${nuevoEstado}`,
    token,
    {
      method: 'PATCH',
    }
  );
}

export async function obtenerResumenAdmin(token) {
  const [aulasData, reservasData, reportesData] = await Promise.all([
    obtenerAulasAdmin(token),
    obtenerReservasAdmin(token),
    obtenerReportesAdmin(token),
  ]);

  const aulas = Array.isArray(aulasData) ? aulasData : [];
  const reservas = Array.isArray(reservasData) ? reservasData : [];
  const reportes = Array.isArray(reportesData) ? reportesData : [];

  const aulasDisponibles = aulas.filter(
    (item) => item.estado_actual === 'disponible'
  ).length;

  const aulasOcupadas = aulas.filter(
    (item) => item.estado_actual === 'ocupado'
  ).length;

  const reportesAbiertos = reportes.filter(
    (item) => item.estado === 'abierto'
  ).length;

  const reportesEnProceso = reportes.filter(
    (item) => item.estado === 'en_proceso'
  ).length;

  const reportesResueltos = reportes.filter(
    (item) => item.estado === 'resuelto'
  ).length;

  return {
    aulas,
    reservas,
    reportes,
    resumen: {
      totalAulas: aulas.length,
      aulasDisponibles,
      aulasOcupadas,
      totalReservas: reservas.length,
      totalReportes: reportes.length,
      reportesAbiertos,
      reportesEnProceso,
      reportesResueltos,
    },
  };

  
}