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

export default function ReporteSummaryCompact({
  total = 0,
  abiertos = 0,
  enProceso = 0,
  resueltos = 0,
  filtroEstado = 'todos',
  onSelectEstado,
}) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={[
          styles.totalBox,
          filtroEstado === 'todos' && styles.totalBoxActive,
        ]}
        onPress={() => onSelectEstado?.('todos')}
        activeOpacity={0.85}
      >
        <View style={styles.iconBox}>
          <Ionicons
            name="document-text-outline"
            size={21}
            color={colors.primary}
          />
        </View>

        <View style={styles.totalTextBox}>
          <Text style={styles.total}>{total}</Text>
          <Text style={styles.totalLabel}>Total reportes</Text>
        </View>

        <View
          style={[
            styles.allChip,
            filtroEstado === 'todos' && styles.allChipActive,
          ]}
        >
          <Text
            style={[
              styles.allChipText,
              filtroEstado === 'todos' && styles.allChipTextActive,
            ]}
          >
            Ver todos
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <StatButton
          label="Abiertos"
          value={abiertos}
          color="#D97706"
          active={filtroEstado === 'abierto'}
          onPress={() => onSelectEstado?.('abierto')}
        />

        <StatButton
          label="En proceso"
          value={enProceso}
          color={colors.primary}
          active={filtroEstado === 'en_proceso'}
          onPress={() => onSelectEstado?.('en_proceso')}
        />

        <StatButton
          label="Resueltos"
          value={resueltos}
          color="#16A34A"
          active={filtroEstado === 'resuelto'}
          onPress={() => onSelectEstado?.('resuelto')}
        />
      </View>
    </View>
  );
}

function StatButton({ label, value, color, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.statBox, active && styles.statBoxActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.statValue, { color }]}>{value}</Text>

      <Text style={[styles.statLabel, active && { color }]}>
        {label}
      </Text>

      {active && <View style={[styles.activeDot, { backgroundColor: color }]} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  totalBox: {
    minHeight: 58,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },

  totalBoxActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  totalTextBox: {
    flex: 1,
  },

  total: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  totalLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    marginTop: -1,
  },

  allChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  allChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  allChipText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
  },

  allChipTextActive: {
    color: colors.white,
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  statBox: {
    flex: 1,
    minHeight: 58,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  statBoxActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },

  statValue: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },

  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    marginTop: 2,
    textAlign: 'center',
  },

  activeDot: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});