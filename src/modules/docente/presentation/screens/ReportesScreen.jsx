import React, { useCallback, useState } from 'react';
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
import { useAuth } from '@clerk/clerk-expo';
import { useFocusEffect } from 'expo-router';

import { crearConexionRealtime } from '../../../../shared/realtime/realtimeClient';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import AppHeader from '../../../../shared/components/organisms/AppHeader';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const CLERK_JWT_TEMPLATE = 'Axis';

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

const GRAVEDAD_COLORS = {
  baja: {
    text: '#16A34A',
    label: 'Baja',
  },
  media: {
    text: colors.primary,
    label: 'Media',
  },
  alta: {
    text: '#DC2626',
    label: 'Alta',
  },
};

export default function ReportesScreen({ token, onBack }) {
  const { getToken } = useAuth();

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarReportes();

      const realtime = crearConexionRealtime({
        onEvento: (evento) => {
          if (evento.tipo === 'reportes_actualizados') {
            cargarReportes();
          }
        },
      });

      return () => {
        realtime?.cerrar();
      };
    }, [])
  );

  const obtenerTokenActual = async () => {
    const tokenActual = await getToken({
      template: CLERK_JWT_TEMPLATE,
      skipCache: true,
    });

    if (tokenActual) {
      return tokenActual;
    }

    if (token) {
      return token;
    }

    throw new Error('No se pudo obtener una sesión activa. Vuelve a iniciar sesión.');
  };

  const leerRespuestaSegura = async (response, valorInicial = {}) => {
    const rawText = await response.text();

    if (!rawText) {
      return valorInicial;
    }

    try {
      return JSON.parse(rawText);
    } catch {
      return valorInicial;
    }
  };

  const cargarReportes = async () => {
    try {
      setLoading(true);

      if (!API_URL) {
        throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
      }

      const tokenActual = await obtenerTokenActual();

      const response = await fetch(`${API_URL}/api/v1/reportes/mis-reportes`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenActual}`,
          Accept: 'application/json',
        },
      });

      const data = await leerRespuestaSegura(response, []);

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
      <View style={styles.summaryCompact}>
        <View style={styles.summaryMain}>
          <Text style={styles.summaryNumber}>{conteos.total}</Text>

          <Text style={styles.summaryText}>
            {conteos.total === 1 ? 'Reporte' : 'Reportes'}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <MiniCount label="Abiertos" value={conteos.abiertos} color="#D97706" />

        <MiniCount
          label="Proceso"
          value={conteos.enProceso}
          color={colors.primary}
        />

        <MiniCount
          label="Resueltos"
          value={conteos.resueltos}
          color="#16A34A"
        />
      </View>
    );
  };

  const renderReporte = (item, index) => {
    const estadoKey = item.estado || 'abierto';
    const estadoConfig = ESTADO_COLORS[estadoKey] || ESTADO_COLORS.abierto;

    const gravedadKey = item.gravedad || 'media';
    const gravedadConfig =
      GRAVEDAD_COLORS[gravedadKey] || GRAVEDAD_COLORS.media;

    const codigo = item.codigo || `TK-${String(index + 1).padStart(3, '0')}`;
    const aula = item.espacio_nombre || item.espacio_id || 'Sin aula';

    return (
      <View key={item.id || index} style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.reportTitleBox}>
            <Text style={styles.reportCodigo}>{codigo}</Text>

            <View style={styles.reportDateRow}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={colors.textSecondary}
              />

              <Text style={styles.reportDate}>
                {formatearFecha(item.fecha_reporte)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: estadoConfig.bg,
              },
            ]}
          >
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

        <Text style={styles.reportDescription} numberOfLines={4}>
          {item.descripcion || 'Sin descripción registrada.'}
        </Text>

        <View style={styles.reportFooter}>
          <View style={styles.footerInfo}>
            <Ionicons
              name="business-outline"
              size={14}
              color={colors.textSecondary}
            />

            <Text style={styles.footerText} numberOfLines={1}>
              {aula}
            </Text>
          </View>

          <View style={styles.gravityInfo}>
            <Text style={styles.gravityLabel}>Gravedad:</Text>

            <Text
              style={[
                styles.gravityValue,
                {
                  color: gravedadConfig.text,
                },
              ]}
            >
              {gravedadConfig.label}
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

      <AppHeader rol="docente" />

      <View style={styles.pageHeader}>

        <View style={styles.pageHeaderText}>
          <Text style={styles.pageTitle}>Incidencias</Text>
          <Text style={styles.pageSubtitle}>Seguimiento de reportes</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={cargarReportes}
          accessibilityLabel="Actualizar"
          activeOpacity={0.85}
        >
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
              <View>
                <Text style={styles.sectionTitle}>Mis reportes</Text>

                <Text style={styles.sectionSubtitle}>
                  Estado actualizado de tus incidencias.
                </Text>
              </View>

              <View style={styles.sectionCountBadge}>
                <Text style={styles.sectionCount}>{reportes.length}</Text>
              </View>
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

function MiniCount({ label, value, color }) {
  return (
    <View style={styles.miniCount}>
      <Text style={[styles.miniCountValue, { color }]}>{value}</Text>
      <Text style={styles.miniCountLabel}>{label}</Text>
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

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  pageHeaderText: {
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

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },


  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollInner: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  summaryCompact: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryMain: {
    minWidth: 76,
    paddingRight: spacing.sm,
  },

  summaryNumber: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  summaryText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    marginTop: -2,
  },

  summaryDivider: {
    width: 1,
    height: 38,
    backgroundColor: colors.border,
    marginRight: spacing.sm,
  },

  miniCount: {
    flex: 1,
    alignItems: 'center',
  },

  miniCountValue: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },

  miniCountLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginTop: 1,
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

  sectionSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  sectionCountBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionCount: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
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
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },

  reportTitleBox: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  reportCodigo: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  reportDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },

  reportDate: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    fontWeight: typography.weight.semibold,
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
    marginBottom: spacing.md,
  },

  reportFooter: {
    minHeight: 36,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  footerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  footerText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },

  gravityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  gravityLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },

  gravityValue: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
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
    height: 52,
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