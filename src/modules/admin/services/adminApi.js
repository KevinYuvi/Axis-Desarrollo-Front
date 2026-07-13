const API_URL = process.env.EXPO_PUBLIC_API_URL;

function convertirValorAtexto(valor) {
  if (!valor) {
    return '';
  }

  if (typeof valor === 'string') {
    return valor;
  }

  if (Array.isArray(valor)) {
    return valor
      .map((item) => convertirValorAtexto(item))
      .filter(Boolean)
      .join('\n');
  }

  if (typeof valor === 'object') {
    if (valor.msg) {
      const campo = Array.isArray(valor.loc)
        ? valor.loc.filter((x) => x !== 'body').join(' > ')
        : '';

      return campo ? `${campo}: ${valor.msg}` : valor.msg;
    }

    if (valor.message) {
      return convertirValorAtexto(valor.message);
    }

    if (valor.detail) {
      return convertirValorAtexto(valor.detail);
    }

    if (valor.error) {
      return convertirValorAtexto(valor.error);
    }

    try {
      return JSON.stringify(valor, null, 2);
    } catch {
      return String(valor);
    }
  }

  return String(valor);
}

function convertirErrorAtexto(errorData) {
  const mensaje = convertirValorAtexto(errorData);

  if (!mensaje || mensaje === '{}') {
    return 'No se pudo completar la solicitud.';
  }

  return mensaje;
}

async function leerRespuestaSegura(response) {
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return {
      detail: rawText,
    };
  }
}

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

  const data = await leerRespuestaSegura(response);

  if (!response.ok) {
    console.log('ERROR BACKEND ADMIN:', data);

    const mensaje = convertirErrorAtexto(data);
    throw new Error(mensaje);
  }

  return data;
}

export async function obtenerAulasAdmin(token) {
  return fetchConToken('/api/v1/espacios/', token);
}

export async function crearAulaAdmin(token, aulaData) {
  return fetchConToken('/api/v1/espacios/', token, {
    method: 'POST',
    body: JSON.stringify(aulaData),
  });
}

export async function actualizarAulaAdmin(token, aulaId, aulaData) {
  return fetchConToken(`/api/v1/espacios/${aulaId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(aulaData),
  });
}

export async function cambiarEstadoAulaAdmin(token, aulaId, nuevoEstado) {
  return fetchConToken(
    `/api/v1/espacios/${aulaId}/estado?nuevo_estado=${encodeURIComponent(
      nuevoEstado
    )}`,
    token,
    {
      method: 'PATCH',
    }
  );
}

export async function obtenerReservasAdmin(token) {
  return fetchConToken('/api/v1/reservas/', token);
}

export async function obtenerReportesAdmin(token) {
  return fetchConToken('/api/v1/reportes/', token);
}

export async function actualizarEstadoReporteAdmin(token, reporteId, nuevoEstado) {
  return fetchConToken(
    `/api/v1/reportes/${reporteId}/estado?nuevo_estado=${encodeURIComponent(
      nuevoEstado
    )}`,
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

  return {
    aulas,
    reservas,
    reportes,
    resumen: {
      totalAulas: aulas.length,
      aulasDisponibles: aulas.filter(
        (item) => item.estado_actual === 'disponible'
      ).length,
      aulasOcupadas: aulas.filter(
        (item) => item.estado_actual === 'ocupado'
      ).length,
      aulasMantenimiento: aulas.filter(
        (item) => item.estado_actual === 'mantenimiento'
      ).length,
      totalReservas: reservas.length,
      totalReportes: reportes.length,
      reportesAbiertos: reportes.filter(
        (item) => item.estado === 'abierto'
      ).length,
      reportesEnProceso: reportes.filter(
        (item) => item.estado === 'en_proceso'
      ).length,
      reportesResueltos: reportes.filter(
        (item) => item.estado === 'resuelto'
      ).length,
    },
  };
}