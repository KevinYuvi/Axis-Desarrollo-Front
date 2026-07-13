import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import { spacing, radius } from '../../../../../shared/theme/spacing';

const ESTADOS = {
  activa: {
    label: 'Activa',
    color: '#16A34A',
    bg: '#DCFCE7',
    line: '#22C55E',
    icon: 'radio-button-on-outline',
  },
  futura: {
    label: 'Futura',
    color: '#D97706',
    bg: '#FEF3C7',
    line: '#F59E0B',
    icon: 'time-outline',
  },
  finalizada: {
    label: 'Finalizada',
    color: '#6B7280',
    bg: '#F3F4F6',
    line: '#9CA3AF',
    icon: 'checkmark-done-outline',
  },
  liberada: {
    label: 'Liberada',
    color: '#DC2626',
    bg: '#FEE2E2',
    line: '#EF4444',
    icon: 'exit-outline',
  },
  sin_horario: {
    label: 'Sin horario',
    color: '#D97706',
    bg: '#FEF3C7',
    line: '#F59E0B',
    icon: 'warning-outline',
  },
};

export default function ReservaCard({ item, estado }) {
  const reserva = item?.reserva || item;
  const espacio = item?.espacio || reserva?.espacio || {};
  const config = ESTADOS[estado] || ESTADOS.sin_horario;

  const aulaNombre =
    espacio?.nombre || reserva?.espacio_nombre || 'Aula no registrada';

  const bloque =
    espacio?.bloque || reserva?.espacio_bloque || 'Sin bloque';

  const ubicacion =
    espacio?.ubicacion || espacio?.bloque || reserva?.espacio_bloque || '—';

  return (
    <View style={styles.cardWrapper}>
      <View style={[styles.estadoLine, { backgroundColor: config.line }]} />

      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="calendar-outline" size={21} color={colors.primary} />
          </View>

          <View style={styles.titleBox}>
            <Text style={styles.title} numberOfLines={1}>
              {reserva?.materia || 'Reserva sin materia'}
            </Text>

            <View style={styles.aulaRow}>
              <Ionicons
                name="business-outline"
                size={13}
                color={colors.textSecondary}
              />

              <Text style={styles.subtitle} numberOfLines={1}>
                {aulaNombre}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={12} color={config.color} />

            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <InfoPill
            icon="time-outline"
            value={formatHorario(reserva?.hora_inicio, reserva?.hora_fin)}
            label="Horario"
          />

          <InfoPill
            icon="location-outline"
            value={ubicacion}
            label="Ubicación"
          />
        </View>

        <View style={styles.metaSection}>
          <MetaItem
            icon="person-outline"
            label="Docente"
            value={reserva?.docente_nombre || 'Docente no registrado'}
          />

          <MetaItem
            icon="layers-outline"
            label="Bloque"
            value={bloque}
          />
        </View>
      </View>
    </View>
  );
}

function InfoPill({ icon, value, label }) {
  return (
    <View style={styles.infoPill}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
      </View>

      <View style={styles.infoTextBox}>
        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>

        <Text style={styles.infoLabel}>{label}</Text>
      </View>
    </View>
  );
}

function MetaItem({ icon, label, value }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={15} color={colors.textSecondary} />

      <View style={styles.metaTextBox}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing.md,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  estadoLine: {
    height: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  card: {
    padding: spacing.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
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

  aulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  subtitle: {
    flex: 1,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginLeft: 3,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },

  statusText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    marginLeft: 4,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },

  infoPill: {
    flex: 1,
    minHeight: 58,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },

  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  infoTextBox: {
    flex: 1,
  },

  infoValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  infoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
    fontWeight: typography.weight.semibold,
  },

  metaSection: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.md,
    padding: spacing.sm,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  metaTextBox: {
    flex: 1,
    marginLeft: spacing.sm,
  },

  metaLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  metaValue: {
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    fontWeight: typography.weight.semibold,
    marginTop: 1,
  },
});