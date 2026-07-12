import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader } from '../../../../shared/components';

import { obtenerAulasAdmin } from '../../services/adminApi';

const CLERK_JWT_TEMPLATE = 'Axis';

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'disponible', label: 'Disponibles' },
  { key: 'ocupado', label: 'Ocupadas' },
  { key: 'mantenimiento', label: 'Mantenimiento' },
];

export default function AdminAulasScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('todos');

  const cargarAulas = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      setError('');

      const token = await getToken({
        template: CLERK_JWT_TEMPLATE,
      });

      const data = await obtenerAulasAdmin(token);

      setAulas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando aulas admin:', err);
      setError(err.message || 'No se pudieron cargar las aulas.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarAulas({ silencioso: true });
    }, [])
  );

  const aulasDisponibles = aulas.filter(
    (item) => item.estado_actual === 'disponible'
  ).length;

  const aulasOcupadas = aulas.filter(
    (item) => item.estado_actual === 'ocupado'
  ).length;

  const aulasMantenimiento = aulas.filter(
    (item) => item.estado_actual === 'mantenimiento'
  ).length;

  const aulasFiltradas = aulas.filter((item) => {
    if (filtroActivo === 'todos') return true;
    return item.estado_actual === filtroActivo;
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader
        rol="admin"
        onNotifPress={() => cargarAulas({ silencioso: false })}
        onProfilePress={() => router.push('/(admin)/perfil')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleTextBox}>
            <Text style={styles.title}>Aulas</Text>
            <Text style={styles.subtitle}>
              Gestión de espacios académicos.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => cargarAulas({ silencioso: false })}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <SkeletonAulas />
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryGrid}>
              <SummaryCard
                icon="business-outline"
                label="Total"
                value={aulas.length}
                color={colors.primary}
                bg="#EFF6FF"
              />

              <SummaryCard
                icon="checkmark-circle-outline"
                label="Disponibles"
                value={aulasDisponibles}
                color="#16A34A"
                bg="#DCFCE7"
              />

              <SummaryCard
                icon="radio-button-on-outline"
                label="Ocupadas"
                value={aulasOcupadas}
                color="#D97706"
                bg="#FEF3C7"
              />

              <SummaryCard
                icon="construct-outline"
                label="Mantenimiento"
                value={aulasMantenimiento}
                color="#DC2626"
                bg="#FEF2F2"
              />
            </View>

            <View style={styles.filterRow}>
              {FILTROS.map((item) => {
                const active = filtroActivo === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setFiltroActivo(item.key)}
                    activeOpacity={0.8}
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
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Listado de aulas</Text>
              <Text style={styles.sectionCounter}>
                {aulasFiltradas.length} registros
              </Text>
            </View>

            {aulasFiltradas.length > 0 ? (
              aulasFiltradas.map((item) => (
                <AulaCard key={item.id || item._id || item.nombre} aula={item} />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="file-tray-outline"
                  size={34}
                  color={colors.textMuted}
                />

                <Text style={styles.emptyTitle}>Sin aulas</Text>
                <Text style={styles.emptyText}>
                  No hay espacios registrados para este filtro.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ icon, label, value, color, bg }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>

      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function AulaCard({ aula }) {
  const estado = aula.estado_actual || 'disponible';

  const estadoConfig = {
    disponible: {
      label: 'Disponible',
      color: '#16A34A',
      bg: '#DCFCE7',
      icon: 'checkmark-circle-outline',
    },
    ocupado: {
      label: 'Ocupada',
      color: '#D97706',
      bg: '#FEF3C7',
      icon: 'radio-button-on-outline',
    },
    mantenimiento: {
      label: 'Mantenimiento',
      color: '#DC2626',
      bg: '#FEF2F2',
      icon: 'construct-outline',
    },
  };

  const config = estadoConfig[estado] || estadoConfig.disponible;

  const equipamiento = Array.isArray(aula.equipamiento) ? aula.equipamiento : [];

  return (
    <View style={styles.aulaCard}>
      <View style={styles.aulaHeader}>
        <View style={styles.aulaIconBox}>
          <Ionicons name="business-outline" size={22} color={colors.primary} />
        </View>

        <View style={styles.aulaTextBox}>
          <Text style={styles.aulaTitle} numberOfLines={1}>
            {aula.nombre || 'Aula sin nombre'}
          </Text>

          <Text style={styles.aulaSubtitle} numberOfLines={1}>
            {aula.ubicacion || aula.bloque || 'Ubicación no registrada'}
          </Text>
        </View>

        <View style={[styles.estadoBadge, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={13} color={config.color} />
          <Text style={[styles.estadoText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <DetailItem
          icon="people-outline"
          label="Capacidad"
          value={aula.capacidad ? `${aula.capacidad}` : '—'}
        />

        <DetailItem
          icon="layers-outline"
          label="Bloque"
          value={aula.bloque || '—'}
        />

        <DetailItem
          icon="cube-outline"
          label="Tipo"
          value={normalizarTexto(aula.tipo)}
        />
      </View>

      <View style={styles.equipmentBox}>
        <View style={styles.equipmentHeader}>
          <Text style={styles.equipmentTitle}>Equipamiento</Text>
          <Text style={styles.equipmentCounter}>{equipamiento.length}</Text>
        </View>

        {equipamiento.length > 0 ? (
          <View style={styles.equipmentGrid}>
            {equipamiento.slice(0, 4).map((item, index) => (
              <View key={`${item}-${index}`} style={styles.equipmentChip}>
                <Text style={styles.equipmentText} numberOfLines={1}>
                  {normalizarTexto(item)}
                </Text>
              </View>
            ))}

            {equipamiento.length > 4 && (
              <View style={styles.equipmentChip}>
                <Text style={styles.equipmentText}>
                  +{equipamiento.length - 4}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.noEquipmentText}>
            Sin equipamiento registrado.
          </Text>
        )}
      </View>
    </View>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={16} color={colors.primary} />

      <View style={styles.detailTextBox}>
        <Text style={styles.detailValue} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
    </View>
  );
}

function SkeletonAulas() {
  return (
    <View>
      <View style={styles.summaryGrid}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.skeletonSummary}>
            <View style={styles.skeletonCircle} />
            <View style={styles.skeletonLineLarge} />
            <View style={styles.skeletonLineSmall} />
          </View>
        ))}
      </View>

      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonTop}>
            <View style={styles.skeletonCircle} />
            <View style={styles.skeletonTextBlock}>
              <View style={styles.skeletonLineTitle} />
              <View style={styles.skeletonLineSub} />
            </View>
          </View>

          <View style={styles.skeletonRow}>
            <View style={styles.skeletonPill} />
            <View style={styles.skeletonPill} />
            <View style={styles.skeletonPill} />
          </View>
        </View>
      ))}
    </View>
  );
}

function normalizarTexto(texto) {
  if (!texto) return 'No registrado';

  return String(texto)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },

  titleTextBox: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },

  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  summaryCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  summaryValue: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  summaryLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginTop: 2,
  },

  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },

  filterText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
  },

  filterTextActive: {
    color: colors.primary,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  sectionCounter: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },

  aulaCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  aulaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  aulaIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  aulaTextBox: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  aulaTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  aulaSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },

  estadoText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },

  detailsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  detailItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },

  detailTextBox: {
    marginTop: 5,
  },

  detailValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: typography.weight.semibold,
  },

  equipmentBox: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  equipmentTitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  equipmentCounter: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },

  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },

  equipmentChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  equipmentText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },

  noEquipmentText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: spacing.lg,
    alignItems: 'center',
  },

  errorText: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: '#DC2626',
    textAlign: 'center',
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },

  emptyText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },

  skeletonSummary: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  skeletonCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  skeletonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  skeletonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    marginBottom: spacing.sm,
  },

  skeletonTextBlock: {
    flex: 1,
    marginLeft: spacing.sm,
  },

  skeletonLineLarge: {
    width: 70,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },

  skeletonLineSmall: {
    width: 110,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonLineTitle: {
    width: '65%',
    height: 16,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },

  skeletonLineSub: {
    width: '45%',
    height: 12,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  skeletonPill: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#E5E7EB',
  },
});