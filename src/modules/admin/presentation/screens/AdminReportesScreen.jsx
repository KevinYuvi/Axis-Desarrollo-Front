import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader } from '../../../../shared/components';

import {
  obtenerReportesAdmin,
  actualizarEstadoReporteAdmin,
} from '../../services/adminApi';

import ReporteCard from '../components/reportes/ReporteCard';
import ReporteSummaryCompact from '../components/reportes/ReporteSummaryCompact';
import ReporteStatusModal from '../components/reportes/ReporteStatusModal';
import SkeletonReportes from '../components/reportes/SkeletonReportes';
import AdminToast from '../components/aulas/AdminToast';

const CLERK_JWT_TEMPLATE = 'Axis';

const FILTROS_GRAVEDAD = [
  { key: 'todas', label: 'Todas' },
  { key: 'baja', label: 'Baja' },
  { key: 'media', label: 'Media' },
  { key: 'alta', label: 'Alta' },
];

export default function AdminReportesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [estadoGuardando, setEstadoGuardando] = useState(null);

  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroGravedad, setFiltroGravedad] = useState('todas');

  const [modalVisible, setModalVisible] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastTipo, setToastTipo] = useState('success');
  const [toastMensaje, setToastMensaje] = useState('');

  const obtenerTokenActual = async () => {
    const token = await getToken({
      template: CLERK_JWT_TEMPLATE,
      skipCache: true,
    });

    if (!token) {
      throw new Error('No se pudo obtener una sesión activa.');
    }

    return token;
  };

  const mostrarToast = ({ tipo = 'success', mensaje }) => {
    setToastTipo(tipo);
    setToastMensaje(mensaje);
    setToastVisible(false);

    setTimeout(() => {
      setToastVisible(true);
    }, 80);
  };

  const cargarReportes = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      setError('');

      const token = await obtenerTokenActual();
      const data = await obtenerReportesAdmin(token);

      setReportes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando reportes admin:', err);
      setError(err.message || 'No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarReportes({ silencioso: true });
    }, [])
  );

  const abrirOpcionesEstado = (reporte) => {
    setEstadoGuardando(null);
    setReporteSeleccionado(reporte);
    setModalVisible(true);
  };

  const cambiarEstado = async (nuevoEstado) => {
    if (!reporteSeleccionado?.id) {
      mostrarToast({
        tipo: 'error',
        mensaje: 'No se pudo identificar el reporte seleccionado.',
      });
      return;
    }

    if (reporteSeleccionado.estado === nuevoEstado) {
      mostrarToast({
        tipo: 'info',
        mensaje: 'El reporte ya tiene ese estado.',
      });
      return;
    }

    try {
      setActualizando(true);
      setEstadoGuardando(nuevoEstado);

      const token = await obtenerTokenActual();

      await actualizarEstadoReporteAdmin(
        token,
        reporteSeleccionado.id,
        nuevoEstado
      );

      mostrarToast({
        tipo: 'success',
        mensaje: 'Estado actualizado correctamente.',
      });

      await cargarReportes({ silencioso: true });

      setModalVisible(false);
      setReporteSeleccionado(null);
      setEstadoGuardando(null);
    } catch (err) {
      console.error('Error actualizando reporte:', err);

      mostrarToast({
        tipo: 'error',
        mensaje: err.message || 'No se pudo actualizar el reporte.',
      });
    } finally {
      setActualizando(false);
      setEstadoGuardando(null);
    }
  };

  const reportesAbiertos = reportes.filter(
    (item) => item.estado === 'abierto'
  ).length;

  const reportesEnProceso = reportes.filter(
    (item) => item.estado === 'en_proceso'
  ).length;

  const reportesResueltos = reportes.filter(
    (item) => item.estado === 'resuelto'
  ).length;

  const reportesFiltrados = reportes.filter((item) => {
    const coincideEstado =
      filtroEstado === 'todos' ? true : item.estado === filtroEstado;

    const coincideGravedad =
      filtroGravedad === 'todas' ? true : item.gravedad === filtroGravedad;

    return coincideEstado && coincideGravedad;
  });

  const obtenerNombreFiltroEstado = () => {
    if (filtroEstado === 'abierto') return 'Abiertos';
    if (filtroEstado === 'en_proceso') return 'En proceso';
    if (filtroEstado === 'resuelto') return 'Resueltos';
    return 'Todos';
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AdminToast
        visible={toastVisible}
        tipo={toastTipo}
        mensaje={toastMensaje}
        onHide={() => setToastVisible(false)}
      />

      <AppHeader
        rol="admin"
        onNotifPress={() => cargarReportes({ silencioso: false })}
        onProfilePress={() => router.push('/(admin)/perfil')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleTextBox}>
            <Text style={styles.title}>Reportes</Text>
            <Text style={styles.subtitle}>Gestión de incidencias.</Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => cargarReportes({ silencioso: false })}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <SkeletonReportes />
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />

            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => cargarReportes({ silencioso: false })}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ReporteSummaryCompact
              total={reportes.length}
              abiertos={reportesAbiertos}
              enProceso={reportesEnProceso}
              resueltos={reportesResueltos}
              filtroEstado={filtroEstado}
              onSelectEstado={setFiltroEstado}
            />

            <View style={styles.gravityCard}>
              <View style={styles.gravityHeader}>
                <Text style={styles.filterLabel}>Gravedad</Text>
              </View>

              <View style={styles.gravityRow}>
                {FILTROS_GRAVEDAD.map((item) => {
                  const active = filtroGravedad === item.key;

                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.gravityChip,
                        active && styles.gravityChipActive,
                      ]}
                      onPress={() => setFiltroGravedad(item.key)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.gravityText,
                          active && styles.gravityTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Listado de reportes</Text>

              <Text style={styles.sectionCounter}>
                {reportesFiltrados.length} registros
              </Text>
            </View>

            {reportesFiltrados.length > 0 ? (
              reportesFiltrados.map((item) => (
                <ReporteCard
                  key={item.id}
                  reporte={item}
                  onPressEstado={() => abrirOpcionesEstado(item)}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="file-tray-outline"
                  size={34}
                  color={colors.textMuted}
                />

                <Text style={styles.emptyTitle}>Sin reportes</Text>

                <Text style={styles.emptyText}>
                  No hay incidencias registradas para estos filtros.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <ReporteStatusModal
        visible={modalVisible}
        reporte={reporteSeleccionado}
        actualizando={actualizando}
        estadoGuardando={estadoGuardando}
        onClose={() => {
          if (!actualizando) {
            setModalVisible(false);
            setReporteSeleccionado(null);
            setEstadoGuardando(null);
          }
        }}
        onChangeEstado={cambiarEstado}
      />
    </SafeAreaView>
  );
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
    marginBottom: spacing.md,
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

  gravityCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  gravityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  filterLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  activeFilterText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },

  gravityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  gravityChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gravityChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },

  gravityText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
  },

  gravityTextActive: {
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

  retryBtn: {
    marginTop: spacing.md,
    minHeight: 42,
    borderRadius: radius.md,
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  retryText: {
    color: colors.white,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
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
});