import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppHeader from '../../../../shared/components/organisms/AppHeader';
import { useOccupancy } from '../../../../shared/hooks/useOccupancy';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'Biblioteca', label: 'Bibliotecas' },
  { id: 'Sala de estudio', label: 'Salas' },
  { id: 'Laboratorio', label: 'Computadoras' },
];

export default function EstudianteBibliotecasScreen() {
  const { loading, spaces, summary, recommendation, reload } = useOccupancy();
  const [filtro, setFiltro] = useState('todos');

  const espaciosFiltrados = useMemo(() => {
    if (filtro === 'todos') return spaces;

    return spaces.filter((item) => item.type === filtro);
  }, [spaces, filtro]);

  const recomendacionNombre =
    recommendation?.name ||
    recommendation?.space?.name ||
    recommendation?.spaceName ||
    null;

  const obtenerEstadoVisual = (space) => {
    const ocupacion = Number(space.occupancy || 0);

    if (space.status === 'available' || ocupacion < 60) {
      return {
        label: 'Disponible',
        color: '#16A34A',
        bg: '#F0FDF4',
        icon: 'checkmark-circle-outline',
      };
    }

    if (space.status === 'busy' || ocupacion >= 85) {
      return {
        label: 'Ocupado',
        color: '#DC2626',
        bg: '#FEF2F2',
        icon: 'alert-circle-outline',
      };
    }

    return {
      label: 'Moderado',
      color: '#D97706',
      bg: '#FEF3C7',
      icon: 'time-outline',
    };
  };

  const renderSkeleton = () => {
    return (
      <View>
        <View style={styles.summarySkeleton}>
          <View style={styles.skeletonLineLarge} />
          <View style={styles.skeletonStatsRow}>
            <View style={styles.skeletonStatBox} />
            <View style={styles.skeletonStatBox} />
            <View style={styles.skeletonStatBox} />
          </View>
        </View>

        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.skeletonCard}>
            <View style={styles.skeletonLineMedium} />
            <View style={styles.skeletonLineSmall} />
            <View style={styles.skeletonDescription} />
          </View>
        ))}
      </View>
    );
  };

  const renderResumen = () => {
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={styles.summaryIcon}>
            <Ionicons name="library-outline" size={22} color={colors.primary} />
          </View>

          <View style={styles.summaryTextBox}>
            <Text style={styles.summaryTitle}>Disponibilidad</Text>

            <Text style={styles.summarySubtitle}>
              Datos actualizados automáticamente por visión IA.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => reload()}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-outline" size={19} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <MiniStat label="Mesas libres" value={summary?.tables || 0} />
          <MiniStat label="Computadoras" value={summary?.computers || 0} />
          <MiniStat label="Salas libres" value={summary?.rooms || 0} />
        </View>

        {recomendacionNombre ? (
          <View style={styles.recommendationBox}>
            <Ionicons
              name="sparkles-outline"
              size={16}
              color={colors.primary}
            />

            <Text style={styles.recommendationText} numberOfLines={2}>
              Recomendado ahora: {recomendacionNombre}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderFiltros = () => {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTROS.map((item) => {
          const active = filtro === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFiltro(item.id)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.filterText,
                  active && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderSpace = (space) => {
    const estado = obtenerEstadoVisual(space);
    const ocupacion = Number(space.occupancy || 0);

    return (
      <View key={space.id} style={styles.spaceCard}>
        <View style={styles.spaceHeader}>
          <View style={styles.spaceIcon}>
            <Ionicons
              name={
                space.type === 'Biblioteca'
                  ? 'library-outline'
                  : space.type === 'Laboratorio'
                    ? 'desktop-outline'
                    : 'people-outline'
              }
              size={21}
              color={colors.primary}
            />
          </View>

          <View style={styles.spaceTitleBox}>
            <Text style={styles.spaceName} numberOfLines={1}>
              {space.name}
            </Text>

            <Text style={styles.spaceType}>
              {space.type} · {space.distanceTime || 'Sin distancia'}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: estado.bg }]}>
            <Ionicons name={estado.icon} size={12} color={estado.color} />
            <Text style={[styles.statusText, { color: estado.color }]}>
              {estado.label}
            </Text>
          </View>
        </View>

        <View style={styles.occupancyBlock}>
          <View style={styles.occupancyTop}>
            <Text style={styles.occupancyLabel}>Ocupación</Text>
            <Text style={styles.occupancyValue}>{ocupacion}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(ocupacion, 100)}%`,
                  backgroundColor: estado.color,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.resourceRow}>
          <ResourceItem
            icon="restaurant-outline"
            label="Mesas"
            value={space.availableTables ?? 0}
          />

          <ResourceItem
            icon="desktop-outline"
            label="Computadoras"
            value={space.availableComputers ?? 0}
          />

          <ResourceItem
            icon="navigate-outline"
            label="Ruta"
            value={space.lat && space.lng ? 'GPS' : 'N/D'}
            textValue
          />
        </View>

        <View style={styles.sourceRow}>
          <Ionicons
            name="eye-outline"
            size={14}
            color={colors.textSecondary}
          />

          <Text style={styles.sourceText}>
            Fuente: {space.raw?.source === 'vision' ? 'Visión IA' : 'Sistema de ocupación'}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="file-tray-outline" size={36} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Sin espacios disponibles</Text>
        <Text style={styles.emptyText}>
          No se encontraron bibliotecas o espacios de estudio para este filtro.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader rol="estudiante" />

      <View style={styles.pageHeader}>
        <View style={styles.pageIcon}>
          <Ionicons name="library-outline" size={18} color={colors.primary} />
        </View>

        <View style={styles.pageTextBox}>
          <Text style={styles.pageTitle}>Bibliotecas</Text>
          <Text style={styles.pageSubtitle}>
            Encuentra espacios libres para estudiar.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          renderSkeleton()
        ) : (
          <>
            {renderResumen()}
            {renderFiltros()}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Espacios disponibles</Text>
              <Text style={styles.sectionCount}>
                {espaciosFiltrados.length}
              </Text>
            </View>

            {espaciosFiltrados.length > 0
              ? espaciosFiltrados.map(renderSpace)
              : renderEmpty()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ label, value }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ResourceItem({ icon, label, value, textValue = false }) {
  return (
    <View style={styles.resourceItem}>
      <Ionicons name={icon} size={15} color={colors.textSecondary} />

      <View style={styles.resourceTextBox}>
        <Text style={styles.resourceValue}>
          {textValue ? value : value}
        </Text>
        <Text style={styles.resourceLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  pageIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  pageTextBox: {
    flex: 1,
  },

  pageTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  pageSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },

  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  summaryTextBox: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  summarySubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },

  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: typography.size.lg,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginTop: 2,
  },

  recommendationBox: {
    marginTop: spacing.sm,
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },

  recommendationText: {
    flex: 1,
    marginLeft: spacing.xs,
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    lineHeight: 17,
  },

  filtersRow: {
    paddingBottom: spacing.md,
  },

  filterChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    marginRight: spacing.sm,
  },

  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },

  filterTextActive: {
    color: colors.white,
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

  sectionCount: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },

  spaceCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  spaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  spaceIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  spaceTitleBox: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  spaceName: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  spaceType: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  statusText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
  },

  occupancyBlock: {
    marginBottom: spacing.md,
  },

  occupancyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  occupancyLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  occupancyValue: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  resourceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  resourceItem: {
    flex: 1,
    minHeight: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },

  resourceTextBox: {
    marginLeft: 6,
  },

  resourceValue: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  resourceLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },

  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },

  sourceText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 5,
    fontWeight: typography.weight.semibold,
  },

  emptyCard: {
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
    marginTop: spacing.md,
  },

  emptyText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.xs,
  },

  summarySkeleton: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  skeletonStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  skeletonStatBox: {
    flex: 1,
    height: 54,
    backgroundColor: '#E5E7EB',
    borderRadius: radius.md,
  },

  skeletonCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  skeletonLineLarge: {
    width: '60%',
    height: 20,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonLineMedium: {
    width: '50%',
    height: 16,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },

  skeletonLineSmall: {
    width: '35%',
    height: 12,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: spacing.md,
  },

  skeletonDescription: {
    width: '100%',
    height: 46,
    borderRadius: radius.md,
    backgroundColor: '#E5E7EB',
  },
});