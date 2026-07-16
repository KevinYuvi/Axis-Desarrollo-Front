import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

import AppHeader from '../../../../shared/components/organisms/AppHeader';
import { obtenerMisReportes } from '../../services/estudianteApi';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const CLERK_JWT_TEMPLATE = 'Axis';

export default function EstudianteReportesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportes, setReportes] = useState([]);
  const [error, setError] = useState('');

  const obtenerTokenAxis = async () => {
    const token = await getToken({
      template: CLERK_JWT_TEMPLATE,
      skipCache: true,
    });

    if (!token) {
      throw new Error('No se pudo obtener una sesión activa.');
    }

    return token;
  };

  const cargarReportes = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) setLoading(true);

      setError('');

      const token = await obtenerTokenAxis();
      const response = await obtenerMisReportes({ token });

      setReportes(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar tus reportes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarReportes();
    }, [])
  );

  const refrescar = () => {
    setRefreshing(true);
    cargarReportes({ silencioso: true });
  };

  const abrirDetalle = (reporte) => {
    if (!reporte?.id) return;

    router.push({
      pathname: '/(estudiante)/reporte/[reporteId]',
      params: {
        reporteId: reporte.id,
        data: encodeURIComponent(JSON.stringify(reporte)),
      },
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader
        rol="estudiante"
        onNotifPress={refrescar}
        onProfilePress={() => router.push('/(estudiante)/perfil')}
      />

      <View style={styles.pageHeader}>
        <View style={styles.pageIcon}>
          <Ionicons
            name="document-text-outline"
            size={18}
            color={colors.primary}
          />
        </View>

        <View style={styles.pageTextBox}>
          <Text style={styles.pageTitle}>Mis reportes</Text>
          <Text style={styles.pageSubtitle}>
            Revisa los inconvenientes que enviaste.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refrescar} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando reportes...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={34} color="#DC2626" />
            <Text style={styles.emptyTitle}>No se pudo cargar</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : reportes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={36}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>Sin reportes enviados</Text>
            <Text style={styles.emptyText}>
              Cuando reportes un inconveniente desde tu clase activa, aparecerá
              aquí.
            </Text>
          </View>
        ) : (
          reportes.map((reporte) => (
            <ReporteCard
              key={reporte.id}
              reporte={reporte}
              onPress={() => abrirDetalle(reporte)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReporteCard({ reporte, onPress }) {
  const estado = obtenerEstadoConfig(reporte.estado);
  const gravedad = obtenerGravedadConfig(reporte.gravedad);
  const imagenes = obtenerImagenesReporte(reporte);
  const totalImagenes = imagenes.length;

  return (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportIcon}>
          <Ionicons name="ticket-outline" size={19} color={colors.primary} />
        </View>

        <View style={styles.reportTitleBox}>
          <Text style={styles.reportCode}>{reporte.codigo || 'Reporte'}</Text>

          <Text style={styles.reportMeta}>
            {formatearFecha(reporte.fecha_reporte)}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: estado.bg }]}>
          <Text style={[styles.statusText, { color: estado.color }]}>
            {estado.label}
          </Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <InfoRow
          icon="school-outline"
          label="Materia"
          value={reporte.materia || 'No registrada'}
        />

        <InfoRow
          icon="business-outline"
          label="Aula"
          value={reporte.aula || reporte.espacio_nombre || 'No registrada'}
        />
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {reporte.descripcion || 'Sin descripción registrada.'}
      </Text>

      <View style={styles.footerRow}>
        <View style={[styles.gravityPill, { backgroundColor: gravedad.bg }]}>
          <Ionicons name={gravedad.icon} size={14} color={gravedad.color} />

          <Text style={[styles.gravityText, { color: gravedad.color }]}>
            {gravedad.label}
          </Text>
        </View>

        {totalImagenes > 0 && (
          <View style={styles.imagePill}>
            <Ionicons
              name="image-outline"
              size={14}
              color={colors.textSecondary}
            />

            <Text style={styles.imagePillText}>
              {totalImagenes} imagen{totalImagenes === 1 ? '' : 'es'}
            </Text>
          </View>
        )}

        <View style={styles.detailPill}>
          <Text style={styles.detailText}>Ver detalle</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function obtenerImagenesReporte(reporte) {
  if (!reporte) return [];

  const posibles = [
    reporte.imagenes,
    reporte.adjuntos,
    reporte.archivos,
    reporte.evidencias,
  ];

  for (const item of posibles) {
    if (Array.isArray(item) && item.length > 0) {
      return item;
    }
  }

  return [];
}

function obtenerEstadoConfig(estado) {
  if (estado === 'cerrado' || estado === 'resuelto') {
    return {
      label: 'Resuelto',
      bg: '#DCFCE7',
      color: '#16A34A',
    };
  }

  if (estado === 'en_proceso') {
    return {
      label: 'En proceso',
      bg: '#FEF3C7',
      color: '#92400E',
    };
  }

  return {
    label: 'Abierto',
    bg: '#EFF6FF',
    color: colors.primary,
  };
}

function obtenerGravedadConfig(gravedad) {
  if (gravedad === 'alta') {
    return {
      label: 'Alta',
      bg: '#FEE2E2',
      color: '#DC2626',
      icon: 'alert-circle-outline',
    };
  }

  if (gravedad === 'baja') {
    return {
      label: 'Baja',
      bg: '#F1F5F9',
      color: '#64748B',
      icon: 'information-circle-outline',
    };
  }

  return {
    label: 'Media',
    bg: '#FEF3C7',
    color: '#92400E',
    icon: 'warning-outline',
  };
}

function formatearFecha(valor) {
  if (!valor) return 'Sin fecha';

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return String(valor);
  }

  return fecha.toLocaleString('es-EC', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
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
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
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

  reportIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  reportTitleBox: {
    flex: 1,
  },

  reportCode: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  reportMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
  },

  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },

  infoLabel: {
    width: 62,
    marginLeft: 6,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
  },

  infoValue: {
    flex: 1,
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    fontWeight: typography.weight.semibold,
  },

  description: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },

  gravityPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  gravityText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },

  imagePill: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
  },

  imagePillText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },

  detailPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  detailText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    marginRight: 3,
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
    marginTop: spacing.sm,
  },

  emptyText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },

  loadingBox: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
});