import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ESTADO_COLORS = {
  abierto: {
    bg: '#FEF3C7',
    text: '#D97706',
    icon: 'alert-circle-outline',
    label: 'Abierto',
  },
  en_proceso: {
    bg: '#EFF6FF',
    text: colors.primary,
    icon: 'time-outline',
    label: 'En proceso',
  },
  resuelto: {
    bg: '#F0FDF4',
    text: '#16A34A',
    icon: 'checkmark-circle-outline',
    label: 'Resuelto',
  },
};

export default function ReportesScreen({ token, onBack }) {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      setLoading(true);

      if (!API_URL) {
        throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
      }

      if (!token) {
        throw new Error('No se encontró el token de sesión.');
      }

      const response = await fetch(`${API_URL}/api/v1/reportes/mis-reportes`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || 'No se pudieron cargar los reportes.');
      }

      setReportes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando reportes:', error);

      Alert.alert(
        'Error',
        error.message || 'No se pudieron cargar los reportes.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';

    const fechaConvertida = new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
      return 'Sin fecha';
    }

    return fechaConvertida.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const obtenerConteos = () => {
    const abiertos = reportes.filter((item) => item.estado === 'abierto').length;
    const enProceso = reportes.filter(
      (item) => item.estado === 'en_proceso'
    ).length;
    const resueltos = reportes.filter(
      (item) => item.estado === 'resuelto'
    ).length;

    return {
      total: reportes.length,
      abiertos,
      enProceso,
      resueltos,
    };
  };

  const conteos = obtenerConteos();

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
            <View style={styles.skeletonCardTop}>
              <View>
                <View style={styles.skeletonLineMedium} />
                <View style={styles.skeletonLineSmall} />
              </View>

              <View style={styles.skeletonBadge} />
            </View>

            <View style={styles.skeletonDescription} />
            <View style={styles.skeletonDescriptionShort} />

            <View style={styles.skeletonFooter}>
              <View style={styles.skeletonChip} />
              <View style={styles.skeletonChip} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderResumen = () => {
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={styles.summaryLabel}>Resumen</Text>
            <Text style={styles.summaryTitle}>
              {conteos.total} {conteos.total === 1 ? 'reporte' : 'reportes'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{conteos.abiertos}</Text>
            <Text style={styles.statLabel}>Abiertos</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{conteos.enProceso}</Text>
            <Text style={styles.statLabel}>En proceso</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{conteos.resueltos}</Text>
            <Text style={styles.statLabel}>Resueltos</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderReporte = (item, index) => {
    const estadoKey = item.estado || 'abierto';
    const estadoConfig = ESTADO_COLORS[estadoKey] || ESTADO_COLORS.abierto;

    return (
      <View key={item.id || index} style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.reportIconBox}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={colors.primary}
            />
          </View>

          <View style={styles.reportHeaderText}>
            <Text style={styles.reportCodigo}>
              {item.codigo || `TK-${String(index + 1).padStart(3, '0')}`}
            </Text>

            <Text style={styles.reportDate}>
              {formatearFecha(item.fecha_reporte)}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: estadoConfig.bg }]}>
            <Ionicons
              name={estadoConfig.icon}
              size={12}
              color={estadoConfig.text}
            />

            <Text style={[styles.statusText, { color: estadoConfig.text }]}>
              {estadoConfig.label}
            </Text>
          </View>
        </View>

        <Text style={styles.reportDescription} numberOfLines={3}>
          {item.descripcion || 'Sin descripción registrada.'}
        </Text>

        <View style={styles.reportMetaRow}>
          <View style={styles.metaChip}>
            <Ionicons
              name="speedometer-outline"
              size={13}
              color={colors.textSecondary}
            />

            <Text style={styles.metaText}>
              {item.gravedad || 'Sin gravedad'}
            </Text>
          </View>

          <View style={styles.metaChip}>
            <Ionicons
              name="business-outline"
              size={13}
              color={colors.textSecondary}
            />

            <Text style={styles.metaText} numberOfLines={1}>
              {item.espacio_nombre || item.espacio_id || 'Sin aula'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconBox}>
          <Ionicons
            name="document-text-outline"
            size={34}
            color={colors.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>Sin reportes todavía</Text>

        <Text style={styles.emptyText}>
          Cuando reportes una incidencia en un aula, aparecerá aquí para que
          puedas revisar su estado.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Incidencias</Text>
          <Text style={styles.headerSubtitle}>Seguimiento de reportes</Text>
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={cargarReportes}
          accessibilityLabel="Actualizar"
        >
          <Ionicons
            name="refresh-outline"
            size={21}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          renderSkeleton()
        ) : (
          <>
            {renderResumen()}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mis reportes</Text>

              <Text style={styles.sectionCount}>
                {reportes.length} {reportes.length === 1 ? 'registro' : 'registros'}
              </Text>
            </View>

            {reportes.length > 0 ? (
              reportes.map((item, index) => renderReporte(item, index))
            ) : (
              renderEmpty()
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  headerTextBox: {
    flex: 1,
  },

  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  headerSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollInner: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  summaryLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },

  summaryTitle: {
    fontSize: typography.size.xl,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  summaryIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: typography.size.lg,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: typography.weight.semibold,
  },

  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.border,
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

  sectionCount: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },

  reportCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  reportIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  reportHeaderText: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  reportCodigo: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  reportDate: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },

  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },

  reportDescription: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },

  reportMetaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },

  metaChip: {
    flex: 1,
    minHeight: 32,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  metaText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.sm,
  },

  emptyIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  emptyText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  summarySkeleton: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  skeletonStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  skeletonStatBox: {
    flex: 1,
    height: 64,
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

  skeletonCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  skeletonLineLarge: {
    width: '50%',
    height: 22,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonLineMedium: {
    width: 140,
    height: 15,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },

  skeletonLineSmall: {
    width: 90,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonBadge: {
    width: 82,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonDescription: {
    width: '100%',
    height: 13,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },

  skeletonDescriptionShort: {
    width: '72%',
    height: 13,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: spacing.md,
  },

  skeletonFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  skeletonChip: {
    flex: 1,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },
});