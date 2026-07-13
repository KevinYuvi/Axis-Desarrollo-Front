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
  disponible: {
    label: 'Disponible',
    color: '#16A34A',
    bg: '#DCFCE7',
    line: '#22C55E',
    icon: 'checkmark-circle-outline',
  },
  ocupado: {
    label: 'Ocupada',
    color: '#D97706',
    bg: '#FEF3C7',
    line: '#F59E0B',
    icon: 'radio-button-on-outline',
  },
  mantenimiento: {
    label: 'Mantenimiento',
    color: '#DC2626',
    bg: '#FEE2E2',
    line: '#EF4444',
    icon: 'construct-outline',
  },
};

export default function AulaCard({ aula, onEditar, onEstado }) {
  const estado = aula?.estado_actual || 'disponible';
  const config = ESTADOS[estado] || ESTADOS.disponible;

  const equipamiento = Array.isArray(aula?.equipamiento)
    ? aula.equipamiento
    : [];

  const tipo = normalizarTexto(aula?.tipo);
  const bloque = aula?.bloque || '—';
  const ubicacion = aula?.ubicacion || 'Ubicación no registrada';

  return (
    <View style={styles.cardWrapper}>
      <View style={[styles.estadoLine, { backgroundColor: config.line }]} />

      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons
              name={
                aula?.tipo === 'laboratorio'
                  ? 'desktop-outline'
                  : 'school-outline'
              }
              size={22}
              color={colors.primary}
            />
          </View>

          <View style={styles.titleBox}>
            <Text style={styles.title} numberOfLines={1}>
              {aula?.nombre || 'Aula sin nombre'}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={13}
                color={colors.textSecondary}
              />

              <Text style={styles.subtitle} numberOfLines={1}>
                Bloque {bloque} · {ubicacion}
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
            icon="people-outline"
            value={aula?.capacidad ? `${aula.capacidad}` : '—'}
            label="Capacidad"
          />

          <InfoPill
            icon="cube-outline"
            value={tipo}
            label="Tipo"
          />
        </View>

        <View style={styles.equipmentSection}>
          <View style={styles.equipmentHeader}>
            <View style={styles.equipmentTitleBox}>
              <Ionicons
                name="hardware-chip-outline"
                size={15}
                color={colors.textSecondary}
              />

              <Text style={styles.equipmentTitle}>Equipamiento</Text>
            </View>

            <View style={styles.equipmentCountBox}>
              <Text style={styles.equipmentCount}>{equipamiento.length}</Text>
            </View>
          </View>

          {equipamiento.length > 0 ? (
            <View style={styles.equipmentGrid}>
              {equipamiento.map((item, index) => {
                const equipo = interpretarEquipo(item);

                return (
                  <View key={`${item}-${index}`} style={styles.equipmentChip}>
                    <Ionicons
                      name={equipo.icon}
                      size={14}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.equipmentText} numberOfLines={1}>
                      {equipo.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noEquipmentBox}>
              <Ionicons
                name="remove-circle-outline"
                size={14}
                color={colors.textMuted}
              />

              <Text style={styles.noEquipmentText}>
                Sin equipamiento registrado
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEditar}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={17} color={colors.primary} />

            <View style={styles.actionTextBox}>
              <Text style={styles.editTitle}>Editar</Text>
              <Text style={styles.actionSubtitle}>Datos y equipos</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusBtn}
            onPress={onEstado}
            activeOpacity={0.85}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={17}
              color={colors.textSecondary}
            />

            <View style={styles.actionTextBox}>
              <Text style={styles.statusTitle}>Estado</Text>
              <Text style={styles.actionSubtitle}>Disponibilidad</Text>
            </View>
          </TouchableOpacity>
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

function interpretarEquipo(item) {
  const texto = String(item || '').toLowerCase();

  if (texto.includes('computadora')) {
    const cantidad = String(item).replace(/\D/g, '');

    return {
      icon: 'desktop-outline',
      label: cantidad ? `${cantidad} computadoras` : 'Computadoras',
    };
  }

  if (texto.includes('proyector')) {
    return {
      icon: 'videocam-outline',
      label: 'Proyector',
    };
  }

  if (texto.includes('parlantes')) {
    return {
      icon: 'volume-high-outline',
      label: 'Parlantes',
    };
  }

  if (texto.includes('pizarra')) {
    return {
      icon: 'easel-outline',
      label: 'Pizarra',
    };
  }

  return {
    icon: 'hardware-chip-outline',
    label: normalizarTexto(item),
  };
}

function normalizarTexto(texto) {
  if (!texto) return 'No registrado';

  return String(texto)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
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

  locationRow: {
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

  equipmentSection: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },

  equipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  equipmentTitleBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  equipmentTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 5,
  },

  equipmentCountBox: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  equipmentCount: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },

  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  equipmentChip: {
    minHeight: 32,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },

  equipmentText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
    marginLeft: 5,
  },

  noEquipmentBox: {
    minHeight: 32,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },

  noEquipmentText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginLeft: 5,
  },

  actionsRow: {
    flexDirection: 'row',
  },

  editBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
  },

  statusBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },

  actionTextBox: {
    flex: 1,
    marginLeft: spacing.sm,
  },

  editTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },

  statusTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  actionSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginTop: 1,
  },
});