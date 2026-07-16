import React, { useMemo } from 'react';
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
import { useRouter } from 'expo-router';

import AppHeader from './organisms/AppHeader';
import { useOccupancy } from '../hooks/useOccupancy';
import { hasLiveCamera } from '../config/camera';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

/**
 * Pantalla compartida de la sección Bibliotecas (p. ej. la Biblioteca Cisco
 * de la Universidad Central). Muestra las estadísticas calculadas desde la
 * cámara con visión IA — cantidad de personas, puestos libres y capacidad —
 * a cualquier rol que tenga habilitada la sección.
 *
 * @param {Object} props
 * @param {string} props.rol - Rol activo ('estudiante', 'admin', ...). Define
 *   el chip del header y el grupo de rutas al navegar (/(rol)/...).
 * @param {boolean} props.mostrarCamara - Solo el rol admin la pasa en true:
 *   agrega el botón "Cámara en vivo" en cada espacio con cámara conectada.
 */
export default function BibliotecasMonitorScreen({
  rol = 'estudiante',
  mostrarCamara = false,
}) {
  const { loading, spaces, reload } = useOccupancy();
  const router = useRouter();

  const espacios = useMemo(() => {
    return Array.isArray(spaces) ? spaces : [];
  }, [spaces]);

  const resumen = useMemo(() => {
    const totalEspacios = espacios.length;

    const capacidadTotal = espacios.reduce(
      (sum, item) => sum + obtenerCapacidad(item),
      0
    );

    const personasDetectadas = espacios.reduce(
      (sum, item) => sum + obtenerPersonas(item),
      0
    );

    const puestosLibres = Math.max(capacidadTotal - personasDetectadas, 0);

    const ocupacionGeneral = calcularOcupacion(
      personasDetectadas,
      capacidadTotal
    );

    return {
      totalEspacios,
      capacidadTotal,
      personasDetectadas,
      puestosLibres,
      ocupacionGeneral,
    };
  }, [espacios]);

  // Navegación a la pantalla de ubicación de la biblioteca. Reutiliza la
  // misma librería de mapas que la sección de aulas (Leaflet en WebView +
  // Google Maps), a través de la ruta biblioteca-ubicacion del grupo del rol.
  const irAUbicacion = (space) => {
    router.push(`/(${rol})/biblioteca-ubicacion/${space.id}`);
  };

  // Navegación a la cámara en tiempo real (solo se ofrece cuando
  // mostrarCamara es true, es decir, para el rol admin).
  const irACamara = (space) => {
    router.push(`/(${rol})/biblioteca-camara/${space.id}`);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader rol={rol} />

      <View style={styles.pageHeader}>
        <View style={styles.pageIcon}>
          <Ionicons name="library-outline" size={18} color={colors.primary} />
        </View>

        <View style={styles.pageTextBox}>
          <Text style={styles.pageTitle}>Biblioteca</Text>
          <Text style={styles.pageSubtitle}>
            Ocupación estimada por personas detectadas.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => reload?.()}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh-outline" size={19} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <LoadingState />
        ) : (
          <>
            <ResumenCard resumen={resumen} />

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Espacios monitoreados</Text>
                <Text style={styles.sectionSubtitle}>
                  Datos generados desde la cámara del sistema.
                </Text>
              </View>

              <Text style={styles.sectionCount}>{espacios.length}</Text>
            </View>

            {espacios.length > 0 ? (
              espacios.map((space) => (
                <EspacioCard
                  key={space.id || space.name}
                  space={space}
                  mostrarCamara={mostrarCamara}
                  onVerUbicacion={() => irAUbicacion(space)}
                  onVerCamara={() => irACamara(space)}
                />
              ))
            ) : (
              <EmptyState />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResumenCard({ resumen }) {
  const estado = obtenerEstadoOcupacion(
    resumen.ocupacionGeneral,
    resumen.capacidadTotal
  );

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View style={styles.summaryIcon}>
          <Ionicons name="people-outline" size={24} color={colors.primary} />
        </View>

        <View style={styles.summaryTextBox}>
          <Text style={styles.summaryTitle}>Ocupación general</Text>

          <Text style={styles.summarySubtitle}>
            {resumen.ocupacionGeneral}% de ocupación estimada.
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: estado.bg }]}>
          <Text style={[styles.statusText, { color: estado.color }]}>
            {estado.label}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${resumen.ocupacionGeneral}%`,
              backgroundColor: estado.color,
            },
          ]}
        />
      </View>

      <View style={styles.statsRow}>
        <MiniStat
          icon="person-outline"
          label="Personas"
          value={resumen.personasDetectadas}
        />

        <MiniStat
          icon="checkmark-circle-outline"
          label="Libres"
          value={resumen.puestosLibres}
        />

        <MiniStat
          icon="grid-outline"
          label="Capacidad"
          value={resumen.capacidadTotal}
        />
      </View>
    </View>
  );
}

function EspacioCard({ space, mostrarCamara, onVerUbicacion, onVerCamara }) {
  const nombre = space?.name || space?.nombre || 'Espacio sin nombre';

  const capacidad = obtenerCapacidad(space);
  const personas = obtenerPersonas(space);
  const libres = Math.max(capacidad - personas, 0);
  const ocupacion = calcularOcupacion(personas, capacidad);
  const estado = obtenerEstadoOcupacion(ocupacion, capacidad);

  // La cámara en vivo solo se ofrece si el rol lo permite (admin) y el
  // espacio realmente tiene una cámara IP conectada (config compartida).
  const puedeVerCamara = mostrarCamara && hasLiveCamera(space?.id);

  return (
    <View style={styles.spaceCard}>
      <View style={styles.spaceHeader}>
        <View style={styles.spaceIcon}>
          <Ionicons name="library-outline" size={22} color={colors.primary} />
        </View>

        <View style={styles.spaceTitleBox}>
          <Text style={styles.spaceName} numberOfLines={1}>
            {nombre}
          </Text>

          <Text style={styles.spaceType} numberOfLines={1}>
            Monitoreo por personas detectadas
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: estado.bg }]}>
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
          label="Libres"
          value={libres}
        />

        <MetricBox
          icon="grid-outline"
          label="Capacidad"
          value={capacidad}
        />
      </View>

      {/*
        Acciones del espacio:
        - "Ver ubicación": disponible para todos los roles con la sección
          habilitada; abre el mapa con la ubicación de la biblioteca (misma
          librería que la ruta al aula).
        - "Cámara en vivo": exclusiva del rol admin y de espacios con cámara.
      */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onVerUbicacion}
          activeOpacity={0.85}
        >
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={styles.actionBtnText}>Ver ubicación</Text>
        </TouchableOpacity>

        {puedeVerCamara && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={onVerCamara}
            activeOpacity={0.85}
          >
            <Ionicons name="videocam-outline" size={16} color={colors.white} />
            <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>
              Cámara en vivo
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sourceRow}>
        <Ionicons name="eye-outline" size={14} color={colors.textSecondary} />

        <Text style={styles.sourceText}>
          Fuente: visión IA · conteo referencial
        </Text>
      </View>
    </View>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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

function LoadingState() {
  return (
    <View>
      <View style={styles.summarySkeleton}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Actualizando ocupación...</Text>
      </View>

      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonLineLarge} />
          <View style={styles.skeletonLineSmall} />
          <View style={styles.skeletonDescription} />
        </View>
      ))}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="file-tray-outline" size={36} color={colors.textMuted} />

      <Text style={styles.emptyTitle}>Sin datos de ocupación</Text>

      <Text style={styles.emptyText}>
        Aún no se recibe información desde el servicio de visión.
      </Text>
    </View>
  );
}

// Capacidad total del espacio. Además de los alias históricos, lee
// space.raw.totalSeats porque OccupancyContext deja los campos originales
// del backend dentro de "raw" al mapear cada espacio.
function obtenerCapacidad(space) {
  return (
    Number(space?.capacity) ||
    Number(space?.capacidad) ||
    Number(space?.totalSeats) ||
    Number(space?.raw?.totalSeats) ||
    Number(space?.total_seats) ||
    Number(space?.seats) ||
    0
  );
}

// Personas detectadas por la visión IA. Prioriza el conteo directo (incluido
// space.raw.occupiedSeats, que es donde el backend reporta las personas
// detectadas por la cámara) y, si no existe, lo estima desde el porcentaje
// de ocupación.
function obtenerPersonas(space) {
  const directo =
    Number(space?.peopleCount) ||
    Number(space?.personas) ||
    Number(space?.personasDetectadas) ||
    Number(space?.people) ||
    Number(space?.occupiedSeats) ||
    Number(space?.raw?.occupiedSeats) ||
    0;

  if (directo > 0) {
    return directo;
  }

  const capacidad = obtenerCapacidad(space);
  const ocupacion =
    Number(space?.occupancy) ||
    Number(space?.occupancyPercent) ||
    Number(space?.ocupacion) ||
    0;

  if (capacidad > 0 && ocupacion > 0) {
    return Math.round((ocupacion / 100) * capacidad);
  }

  return 0;
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
      label: 'Lleno',
      color: '#DC2626',
      bg: '#FEE2E2',
    };
  }

  if (ocupacion >= 55) {
    return {
      label: 'Moderado',
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

  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: spacing.lg,
  },

  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  summaryTextBox: {
    flex: 1,
    paddingRight: spacing.sm,
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
    marginTop: 2,
  },

  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginTop: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  sectionSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
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
    paddingVertical: 6,
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
    marginBottom: spacing.md,
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  metricBox: {
    flex: 1,
    minHeight: 58,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
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

  // Estilos de la fila de acciones (botones "Ver ubicación" y "Cámara en
  // vivo") agregada para la sección de bibliotecas.
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  actionBtn: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },

  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },

  actionBtnText: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },

  actionBtnTextPrimary: {
    color: colors.white,
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
    minHeight: 160,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
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

  skeletonLineSmall: {
    width: '35%',
    height: 12,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
    marginBottom: spacing.md,
  },

  skeletonDescription: {
    width: '100%',
    height: 46,
    borderRadius: radius.md,
    backgroundColor: '#E5E7EB',
  },
});
