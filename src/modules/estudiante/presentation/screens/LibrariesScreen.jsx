import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '../../../../shared/hooks/useClerkOrMock';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader } from '../../../../shared/components';
import { useOccupancy } from '../../../../shared/hooks/useOccupancy';

export default function LibrariesScreen({ onNavigateToCamera }) {
  const { loading, spaces } = useOccupancy();
  const { user } = useUser();

  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'estudiante';

  const espaciosDisponibles = useMemo(() => {
    return Array.isArray(spaces) ? spaces : [];
  }, [spaces]);

  const resumen = useMemo(() => {
    const totalEspacios = espaciosDisponibles.length;

    const totalCapacidad = espaciosDisponibles.reduce(
      (sum, item) => sum + obtenerCapacidad(item),
      0
    );

    const totalPersonas = espaciosDisponibles.reduce(
      (sum, item) => sum + obtenerPersonasDetectadas(item),
      0
    );

    const totalDisponibles = Math.max(totalCapacidad - totalPersonas, 0);

    return {
      totalEspacios,
      totalCapacidad,
      totalPersonas,
      totalDisponibles,
    };
  }, [espaciosDisponibles]);

  const handleSpaceDetail = (space) => {
    if (!space?.id) return;

    onNavigateToCamera?.(space.id);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />

      <AppHeader rol={rol} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="library-outline" size={24} color={colors.primary} />
          </View>

          <View style={styles.headerTextBox}>
            <Text style={styles.title}>Biblioteca</Text>
            <Text style={styles.subtitle}>
              Consulta la ocupación estimada según personas detectadas.
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{resumen.totalPersonas}</Text>
            <Text style={styles.summaryLabel}>personas</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{resumen.totalDisponibles}</Text>
            <Text style={styles.summaryLabel}>puestos libres</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{resumen.totalCapacidad}</Text>
            <Text style={styles.summaryLabel}>capacidad</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Espacios monitoreados</Text>
          <Text style={styles.sectionCounter}>
            {resumen.totalEspacios} espacio{resumen.totalEspacios === 1 ? '' : 's'}
          </Text>
        </View>

        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingText}>Actualizando ocupación...</Text>
            </View>
          ) : espaciosDisponibles.length > 0 ? (
            espaciosDisponibles.map((space) => (
              <OccupancySpaceCard
                key={space.id}
                space={space}
                onPress={() => handleSpaceDetail(space)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={34} color={colors.textMuted} />

              <Text style={styles.emptyTitle}>Sin espacios disponibles</Text>

              <Text style={styles.emptyText}>
                Aún no se recibe información de ocupación desde el servicio de visión.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function OccupancySpaceCard({ space, onPress }) {
  const nombre = space?.name || space?.nombre || 'Espacio sin nombre';

  const capacidad = obtenerCapacidad(space);
  const personas = obtenerPersonasDetectadas(space);
  const disponibles = Math.max(capacidad - personas, 0);
  const ocupacion = calcularOcupacion(personas, capacidad);
  const estado = obtenerEstadoOcupacion(ocupacion, capacidad);

  return (
    <TouchableOpacity
      style={styles.spaceCard}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View style={styles.spaceHeader}>
        <View style={styles.spaceIcon}>
          <Ionicons name="people-outline" size={22} color={colors.primary} />
        </View>

        <View style={styles.spaceTitleBox}>
          <Text style={styles.spaceTitle} numberOfLines={1}>
            {nombre}
          </Text>

          <Text style={styles.spaceSubtitle} numberOfLines={1}>
            Monitoreo por cámara · YOLO
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: estado.bg }]}>
          <Text style={[styles.statusText, { color: estado.color }]}>
            {estado.label}
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressLabel}>Ocupación estimada</Text>
          <Text style={styles.progressValue}>{ocupacion}%</Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${ocupacion}%`,
                backgroundColor: estado.color,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricBox
          icon="person-outline"
          label="Personas"
          value={personas}
        />

        <MetricBox
          icon="checkmark-circle-outline"
          label="Disponibles"
          value={disponibles}
        />

        <MetricBox
          icon="grid-outline"
          label="Capacidad"
          value={capacidad}
        />
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailText}>Ver detalle del espacio</Text>
        <Ionicons name="chevron-forward" size={17} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

function MetricBox({ icon, label, value }) {
  return (
    <View style={styles.metricBox}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />

      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function obtenerCapacidad(space) {
  return (
    Number(space?.totalSeats) ||
    Number(space?.capacity) ||
    Number(space?.capacidad) ||
    Number(space?.total_seats) ||
    0
  );
}

function obtenerPersonasDetectadas(space) {
  return (
    Number(space?.peopleCount) ||
    Number(space?.occupiedSeats) ||
    Number(space?.personas) ||
    Number(space?.personasDetectadas) ||
    0
  );
}

function calcularOcupacion(personas, capacidad) {
  if (!capacidad || capacidad <= 0) return 0;

  const porcentaje = Math.round((personas / capacidad) * 100);

  if (porcentaje < 0) return 0;
  if (porcentaje > 100) return 100;

  return porcentaje;
}

function obtenerEstadoOcupacion(ocupacion, capacidad) {
  if (!capacidad || capacidad <= 0) {
    return {
      label: 'Sin datos',
      color: '#64748B',
      bg: '#F1F5F9',
    };
  }

  if (ocupacion >= 85) {
    return {
      label: 'Alta ocupación',
      color: '#DC2626',
      bg: '#FEE2E2',
    };
  }

  if (ocupacion >= 55) {
    return {
      label: 'Media',
      color: '#D97706',
      bg: '#FEF3C7',
    };
  }

  return {
    label: 'Disponible',
    color: '#16A34A',
    bg: '#DCFCE7',
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },

  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },

  headerCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  headerTextBox: {
    flex: 1,
  },

  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 19,
  },

  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryValue: {
    fontSize: typography.size.lg,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  summaryLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.border,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  sectionCounter: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },

  listContainer: {
    marginTop: spacing.xs,
  },

  spaceCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  spaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  spaceIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  spaceTitleBox: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  spaceTitle: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  spaceSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 3,
  },

  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
  },

  progressSection: {
    marginTop: spacing.md,
  },

  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  progressLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },

  progressValue: {
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  progressBar: {
    height: 9,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },

  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  metricBox: {
    flex: 1,
    minHeight: 62,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },

  metricValue: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    marginTop: 2,
  },

  metricLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginTop: 1,
  },

  detailRow: {
    marginTop: spacing.md,
    minHeight: 40,
    borderRadius: radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailText: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    marginRight: 4,
  },

  loadingBox: {
    minHeight: 220,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },

  emptyState: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    marginTop: spacing.sm,
  },

  emptyText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 20,
  },
});