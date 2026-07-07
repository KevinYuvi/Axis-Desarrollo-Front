import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import Button from './Button';

export default function SpaceListCard({ space, onPressDetail, onAnalyzeVision, analyzing }) {
  let statusColor = colors.primary;
  if (space.status === 'Disponible') statusColor = colors.available;
  else if (space.status === 'Próximo') statusColor = colors.warning;
  else if (space.status === 'Ocupado') statusColor = colors.critical;

  const isVisionSource = space.raw?.source === 'vision-service';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{space.name}</Text>
        <View style={[styles.badge, { backgroundColor: `${statusColor}1A` }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{space.status}</Text>
        </View>
      </View>

      <View style={styles.sourceBadge}>
        <Feather name={isVisionSource ? 'eye' : 'cpu'} size={11} color={colors.textSecondary} style={{ marginRight: 4 }} />
        <Text style={styles.sourceBadgeText}>Fuente: {isVisionSource ? 'Visión IA' : 'Simulado'}</Text>
      </View>

      <Text style={styles.subtitle}>{space.type} · {space.distanceTime}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{space.occupancy}%</Text>
          <Text style={styles.statLabel}>Ocupación</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{space.availableTables}</Text>
          <Text style={styles.statLabel}>Mesas libres</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{space.availableComputers}</Text>
          <Text style={styles.statLabel}>PCs libres</Text>
        </View>
      </View>

      <Text style={styles.resources}>
        Recursos: {space.resources.join(', ')}
      </Text>

      <View style={styles.buttonContainer}>
        <Button title="Ver detalle" onPress={() => onPressDetail(space)} />
      </View>

      {onAnalyzeVision && (
        <TouchableOpacity
          style={[styles.visionButton, analyzing && styles.visionButtonDisabled]}
          onPress={() => onAnalyzeVision(space.id)}
          disabled={analyzing}
        >
          {analyzing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Feather name="camera" size={14} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.visionButtonText}>Actualizar con visión IA</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  sourceBadgeText: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  visionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  visionButtonDisabled: {
    opacity: 0.6,
  },
  visionButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  resources: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: spacing.xs,
  }
});
