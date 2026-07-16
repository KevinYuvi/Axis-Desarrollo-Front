import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import { spacing, radius } from '../../../../../shared/theme/spacing';

const ESTADOS = {
  activa: {
    label: 'En curso',
    color: '#15803D',
    bg: '#DCFCE7',
    line: '#22C55E',
    icon: 'radio-button-on-outline',
  },
  futura: {
    label: 'Próxima',
    color: '#B45309',
    bg: '#FEF3C7',
    line: '#F59E0B',
    icon: 'time-outline',
  },
  finalizada: {
    label: 'Finalizada',
    color: '#475569',
    bg: '#F1F5F9',
    line: '#94A3B8',
    icon: 'checkmark-done-outline',
  },
  liberada: {
    label: 'Liberada',
    color: '#B91C1C',
    bg: '#FEE2E2',
    line: '#EF4444',
    icon: 'exit-outline',
  },
  cancelada: {
    label: 'Cancelada',
    color: '#B91C1C',
    bg: '#FEE2E2',
    line: '#EF4444',
    icon: 'close-circle-outline',
  },
  sin_horario: {
    label: 'Revisar',
    color: '#B45309',
    bg: '#FEF3C7',
    line: '#F59E0B',
    icon: 'warning-outline',
  },
};

export default function ReservaCard({
  item,
  estado,
  onLiberar,
  liberando = false,
}) {
  const reserva = item?.reserva || item;
  const espacio = item?.espacio || reserva?.espacio || {};
  const estadoFinal = estado || obtenerEstadoReserva(reserva);
  const config = ESTADOS[estadoFinal] || ESTADOS.sin_horario;

  const puedeLiberar = estadoFinal === 'activa' || estadoFinal === 'futura';

  const aulaNombre =
    reserva?.espacio_nombre ||
    reserva?.aula ||
    espacio?.nombre ||
    'Aula no registrada';

  const bloque =
    reserva?.espacio_bloque ||
    reserva?.bloque ||
    espacio?.bloque ||
    '';

  const ubicacion =
    reserva?.ubicacion ||
    espacio?.ubicacion ||
    espacio?.referencia ||
    espacio?.direccion ||
    '';

  return (
    <View style={styles.cardWrapper}>
      <View style={[styles.estadoLine, { backgroundColor: config.line }]} />

      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
          </View>

          <View style={styles.titleBox}>
            <Text style={styles.title} numberOfLines={1}>
              {reserva?.materia || 'Reserva sin materia'}
            </Text>

            <Text style={styles.subtitle} numberOfLines={1}>
              {aulaNombre}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={12} color={config.color} />
            <Text style={[styles.badgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <View style={styles.mainInfo}>
          <View style={styles.infoBox}>
            <Ionicons name="time-outline" size={17} color={colors.primary} />
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Horario</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {formatHorario(reserva?.hora_inicio, reserva?.hora_fin)}
              </Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="person-outline" size={17} color={colors.primary} />
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Docente</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {reserva?.docente_nombre || 'No registrado'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailBox}>
          <View style={styles.detailItem}>
            <Ionicons name="layers-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {bloque || 'Bloque no registrado'}
            </Text>
          </View>

          {!!ubicacion && ubicacion !== 'Ubicación no registrada' && (
            <View style={styles.detailItem}>
              <Ionicons
                name="location-outline"
                size={15}
                color={colors.textSecondary}
              />
              <Text style={styles.detailText} numberOfLines={1}>
                {ubicacion}
              </Text>
            </View>
          )}
        </View>

        {puedeLiberar && (
          <TouchableOpacity
            style={[styles.liberarBtn, liberando && styles.liberarBtnDisabled]}
            onPress={() => onLiberar?.(reserva)}
            disabled={liberando}
            activeOpacity={0.85}
          >
            <Ionicons name="exit-outline" size={17} color={colors.white} />
            <Text style={styles.liberarText}>
              {liberando ? 'Liberando...' : 'Liberar aula'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function obtenerEstadoReserva(reserva) {
  if (reserva?.estado === 'liberada' || reserva?.liberada_anticipadamente) {
    return 'liberada';
  }

  if (reserva?.estado === 'cancelada') {
    return 'cancelada';
  }

  return reserva?.estado_tiempo || 'sin_horario';
}

function convertirFecha(fechaTexto) {
  if (!fechaTexto) return null;

  const fecha = new Date(fechaTexto);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function formatHorario(isoInicio, isoFin) {
  if (!isoInicio || !isoFin) return 'N/A';

  const inicio = convertirFecha(isoInicio);
  const fin = convertirFecha(isoFin);

  if (!inicio || !fin) return 'N/A';

  const opciones = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  return `${inicio.toLocaleTimeString([], opciones)} – ${fin.toLocaleTimeString(
    [],
    opciones
  )}`;
}

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
    overflow: 'hidden',
  },

  estadoLine: {
    height: 4,
  },

  card: {
    padding: spacing.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  titleBox: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  subtitle: {
    marginTop: 3,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    marginLeft: 4,
  },

  mainInfo: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  infoBox: {
    flex: 1,
    minHeight: 58,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoTextBox: {
    flex: 1,
    marginLeft: spacing.xs,
  },

  infoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
  },

  infoValue: {
    marginTop: 2,
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  detailBox: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.sm,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  detailText: {
    flex: 1,
    marginLeft: spacing.xs,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },

  liberarBtn: {
    marginTop: spacing.md,
    minHeight: 42,
    borderRadius: radius.md,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  liberarBtnDisabled: {
    opacity: 0.65,
  },

  liberarText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.xs,
  },
});