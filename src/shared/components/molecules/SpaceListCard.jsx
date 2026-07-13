import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import Button from '../atoms/Button';

export default function SpaceListCard({ space, onPressDetail }) {
  const router = useRouter();
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
        <View style={{ height: spacing.xs }} />
        <Button
          title="Cómo llegar"
          variant="secondary"
          onPress={() => {
            if (space.lat && space.lng) {
              router.push(`/ruta/${space.id}?lat=${space.lat}&lng=${space.lng}&nombre=${encodeURIComponent(space.name)}`);
            } else {
              router.push(`/ruta/${space.id}`);
            }
          }}
        />
      </View>
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
