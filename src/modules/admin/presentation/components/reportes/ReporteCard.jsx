import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import { spacing, radius } from '../../../../../shared/theme/spacing';

const ESTADOS = {
  abierto: {
    label: 'Abierto',
    color: '#D97706',
    bg: '#FEF3C7',
    line: '#F59E0B',
    icon: 'alert-circle-outline',
  },
  en_proceso: {
    label: 'En proceso',
    color: colors.primary,
    bg: '#EFF6FF',
    line: '#3B82F6',
    icon: 'time-outline',
  },
  resuelto: {
    label: 'Resuelto',
    color: '#16A34A',
    bg: '#DCFCE7',
    line: '#22C55E',
    icon: 'checkmark-circle-outline',
  },
};

const GRAVEDAD = {
  baja: {
    label: 'Baja',
    color: '#16A34A',
    bg: '#DCFCE7',
    icon: 'chevron-down-circle-outline',
  },
  media: {
    label: 'Media',
    color: colors.primary,
    bg: '#EFF6FF',
    icon: 'remove-circle-outline',
  },
  alta: {
    label: 'Alta',
    color: '#DC2626',
    bg: '#FEE2E2',
    icon: 'alert-circle-outline',
  },
};

export default function ReporteCard({ reporte, onPressEstado }) {
  const estado = ESTADOS[reporte?.estado] || ESTADOS.abierto;
  const gravedad = GRAVEDAD[reporte?.gravedad] || GRAVEDAD.media;

  return (
    <View style={styles.cardWrapper}>
      <View style={[styles.estadoLine, { backgroundColor: estado.line }]} />

      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons
              name="document-text-outline"
              size={21}
              color={colors.primary}
            />
          </View>

          <View style={styles.titleBox}>
            <Text style={styles.title} numberOfLines={1}>
              {reporte?.codigo || 'Reporte'}
            </Text>

            <View style={styles.dateRow}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={colors.textSecondary}
              />

              <Text style={styles.subtitle} numberOfLines={1}>
                {formatearFecha(reporte?.fecha_reporte)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: estado.bg }]}
            onPress={onPressEstado}
            activeOpacity={0.85}
          >
            <Ionicons name={estado.icon} size={12} color={estado.color} />

            <Text style={[styles.statusText, { color: estado.color }]}>
              {estado.label}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {reporte?.descripcion || 'Sin descripción registrada.'}
        </Text>

        <View style={styles.infoRow}>
          <InfoPill
            icon={gravedad.icon}
            value={gravedad.label}
            label="Gravedad"
            color={gravedad.color}
            bg={gravedad.bg}
          />

          <InfoPill
            icon="business-outline"
            value={reporte?.espacio_nombre || 'Aula no registrada'}
            label="Espacio"
          />
        </View>

        <View style={styles.metaSection}>
          <Ionicons
            name="person-outline"
            size={15}
            color={colors.textSecondary}
          />

          <View style={styles.metaTextBox}>
            <Text style={styles.metaLabel}>Docente</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {reporte?.docente_nombre || 'Docente no registrado'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function InfoPill({ icon, value, label, color = colors.textSecondary, bg = '#F8FAFC' }) {
  return (
    <View style={[styles.infoPill, { backgroundColor: bg }]}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={16} color={color} />
      </View>

      <View style={styles.infoTextBox}>
        <Text style={[styles.infoValue, { color }]} numberOfLines={1}>
          {value}
        </Text>

        <Text style={styles.infoLabel}>{label}</Text>
      </View>
    </View>
  );
}

function formatearFecha(fechaTexto) {
  if (!fechaTexto) return 'Sin fecha';

  const fecha = new Date(fechaTexto);

  if (Number.isNaN(fecha.getTime())) {
    return 'Sin fecha';
  }

  return fecha.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
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

  dateRow: {
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
    textTransform: 'capitalize',
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

  description: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },

  infoPill: {
    flex: 1,
    minHeight: 58,
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
    backgroundColor: colors.white,
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
    flexDirection: 'row',
    alignItems: 'center',
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