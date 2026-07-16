import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import { spacing, radius } from '../../../../../shared/theme/spacing';

export default function ReservaSummaryCompact({
  total = 0,
  activas = 0,
  futuras = 0,
}) {
  const totalVigentes = total || activas + futuras;

  return (
    <View style={styles.card}>
      <View style={styles.leftBox}>
        <View style={styles.iconBox}>
          <Ionicons name="calendar-outline" size={21} color={colors.primary} />
        </View>

        <View>
          <Text style={styles.total}>{totalVigentes}</Text>
          <Text style={styles.totalLabel}>Vigentes</Text>
        </View>
      </View>

      <View style={styles.rightBox}>
        <MiniStat label="Activas" value={activas} color="#16A34A" />
        <MiniStat label="Futuras" value={futuras} color={colors.primary} />
      </View>
    </View>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <View style={styles.mini}>
      <Text style={[styles.miniValue, { color }]}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
  },

  leftBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  total: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  totalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    marginTop: -2,
  },

  rightBox: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  mini: {
    alignItems: 'center',
  },

  miniValue: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },

  miniLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    marginTop: 1,
  },
});