/**
 * Traduce el estado de ocupación de un espacio a un mensaje simple sobre
 * si conviene ir o no, para mostrar junto al video en vivo.
 * @param {string} status - Estado de ocupación ("Disponible", "Próximo", "Ocupado", "Sin datos")
 * @returns {{label: string, tone: 'available'|'warning'|'critical'|'neutral'}} Mensaje y tono visual
 */
function getVisitRecommendation(status) {
  if (status === 'Disponible') {
    return { label: 'Sí, puedes ir: hay espacio disponible.', tone: 'available' };
  }
  if (status === 'Próximo') {
    return { label: 'Podría haber espera; considera otra opción si tienes prisa.', tone: 'warning' };
  }
  if (status === 'Ocupado') {
    return { label: 'Mejor no vayas ahora: está lleno.', tone: 'critical' };
  }
  return { label: 'Todavía no hay suficiente información de este espacio.', tone: 'neutral' };
}

export { getVisitRecommendation };
