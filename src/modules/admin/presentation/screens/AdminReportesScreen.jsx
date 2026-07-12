import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
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

const CLERK_JWT_TEMPLATE = 'Axis';

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'abierto', label: 'Abiertos' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'resuelto', label: 'Resueltos' },
];

const ESTADOS = [
  {
    value: 'abierto',
    label: 'Abierto',
    icon: 'alert-circle-outline',
    color: '#D97706',
    bg: '#FEF3C7',
  },
  {
    value: 'en_proceso',
    label: 'En proceso',
    icon: 'time-outline',
    color: colors.primary,
    bg: '#EFF6FF',
  },
  {
    value: 'resuelto',
    label: 'Resuelto',
    icon: 'checkmark-circle-outline',
    color: '#16A34A',
    bg: '#DCFCE7',
  },
];

const GRAVEDAD = {
  baja: {
    label: 'Baja',
    color: '#16A34A',
    bg: '#DCFCE7',
    icon: 'chevron-down-circle-outline',
  },
  media: {
    label: 'Media',
    color: colors.primary,
    bg: '#EFF6FF',
    icon: 'remove-circle-outline',
  },
  alta: {
    label: 'Alta',
    color: '#DC2626',
    bg: '#FEF2F2',
    icon: 'alert-circle-outline',
  },
};

export default function AdminReportesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('todos');

  const [modalVisible, setModalVisible] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackTipo, setFeedbackTipo] = useState('info');
  const [feedbackTitulo, setFeedbackTitulo] = useState('');
  const [feedbackMensaje, setFeedbackMensaje] = useState('');

  const cargarReportes = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      setError('');

      const token = await getToken({
        template: CLERK_JWT_TEMPLATE,
      });

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

  const mostrarFeedback = ({ tipo = 'info', titulo, mensaje }) => {
    setFeedbackTipo(tipo);
    setFeedbackTitulo(titulo);
    setFeedbackMensaje(mensaje);
    setFeedbackVisible(true);
  };

  const abrirOpcionesEstado = (reporte) => {
    setReporteSeleccionado(reporte);
    setModalVisible(true);
  };

  const cambiarEstado = async (nuevoEstado) => {
    if (!reporteSeleccionado?.id) {
      mostrarFeedback({
        tipo: 'error',
        titulo: 'Error',
        mensaje: 'No se pudo identificar el reporte seleccionado.',
      });
      return;
    }

    try {
      setActualizando(true);

      const token = await getToken({
        template: CLERK_JWT_TEMPLATE,
      });

      await actualizarEstadoReporteAdmin(
        token,
        reporteSeleccionado.id,
        nuevoEstado
      );

      setModalVisible(false);
      setReporteSeleccionado(null);

      await cargarReportes({ silencioso: true });

      mostrarFeedback({
        tipo: 'success',
        titulo: 'Estado actualizado',
        mensaje: 'El reporte fue actualizado correctamente.',
      });
    } catch (err) {
      console.error('Error actualizando reporte:', err);

      mostrarFeedback({
        tipo: 'error',
        titulo: 'No se pudo actualizar',
        mensaje: err.message || 'Ocurrió un error al actualizar el reporte.',
      });
    } finally {
      setActualizando(false);
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
    if (filtroActivo === 'todos') return true;
    return item.estado === filtroActivo;
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

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
            <Text style={styles.subtitle}>
              Gestión de incidencias registradas.
            </Text>
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
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Resumen</Text>
              <Text style={styles.summaryTitle}>{reportes.length} reportes</Text>

              <View style={styles.statusRow}>
                <StatusBox
                  label="Abiertos"
                  value={reportesAbiertos}
                  color="#D97706"
                  bg="#FEF3C7"
                />

                <StatusBox
                  label="En proceso"
                  value={reportesEnProceso}
                  color={colors.primary}
                  bg="#EFF6FF"
                />

                <StatusBox
                  label="Resueltos"
                  value={reportesResueltos}
                  color="#16A34A"
                  bg="#DCFCE7"
                />
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterContent}
            >
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
            </ScrollView>

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
                  No hay incidencias registradas para este filtro.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <EstadoModal
        visible={modalVisible}
        reporte={reporteSeleccionado}
        actualizando={actualizando}
        onClose={() => {
          if (!actualizando) {
            setModalVisible(false);
            setReporteSeleccionado(null);
          }
        }}
        onChangeEstado={cambiarEstado}
      />

      <FeedbackModal
        visible={feedbackVisible}
        tipo={feedbackTipo}
        titulo={feedbackTitulo}
        mensaje={feedbackMensaje}
        onClose={() => setFeedbackVisible(false)}
      />
    </SafeAreaView>
  );
}

function ReporteCard({ reporte, onPressEstado }) {
  const estado = ESTADOS.find((item) => item.value === reporte.estado) || ESTADOS[0];
  const gravedad = GRAVEDAD[reporte.gravedad] || GRAVEDAD.media;

  return (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportIconBox}>
          <Ionicons name="document-text-outline" size={21} color={colors.primary} />
        </View>

        <View style={styles.reportTitleBox}>
          <Text style={styles.reportCode}>
            {reporte.codigo || 'Reporte'}
          </Text>

          <Text style={styles.reportDate}>
            {formatearFecha(reporte.fecha_reporte)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.estadoBadge, { backgroundColor: estado.bg }]}
          onPress={onPressEstado}
          activeOpacity={0.8}
        >
          <Ionicons name={estado.icon} size={13} color={estado.color} />

          <Text style={[styles.estadoText, { color: estado.color }]}>
            {estado.label}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.reportDescription}>{reporte.descripcion}</Text>

      <View style={styles.metaGrid}>
        <MetaItem
          icon={gravedad.icon}
          label={gravedad.label}
          color={gravedad.color}
          bg={gravedad.bg}
        />

        <MetaItem
          icon="business-outline"
          label={reporte.espacio_nombre || 'Aula no registrada'}
          color={colors.textSecondary}
          bg="#F8FAFC"
        />
      </View>

      <View style={styles.teacherRow}>
        <Ionicons name="person-outline" size={15} color={colors.textSecondary} />

        <Text style={styles.teacherText} numberOfLines={1}>
          {reporte.docente_nombre || 'Docente no registrado'}
        </Text>
      </View>
    </View>
  );
}

function MetaItem({ icon, label, color, bg }) {
  return (
    <View style={[styles.metaItem, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={14} color={color} />

      <Text style={[styles.metaText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function StatusBox({ label, value, color, bg }) {
  return (
    <View style={[styles.statusBox, { backgroundColor: bg }]}>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
      <Text style={[styles.statusLabel, { color }]}>{label}</Text>
    </View>
  );
}

function EstadoModal({
  visible,
  reporte,
  actualizando,
  onClose,
  onChangeEstado,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlayBottom}>
        <View style={styles.estadoModalCard}>
          <View style={styles.modalHandle} />

          <View style={styles.estadoModalHeader}>
            <View>
              <Text style={styles.estadoModalTitle}>Cambiar estado</Text>
              <Text style={styles.estadoModalSub}>
                {reporte?.codigo || 'Reporte seleccionado'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              disabled={actualizando}
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {ESTADOS.map((item) => {
            const active = reporte?.estado === item.value;

            return (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.estadoOption,
                  active && {
                    borderColor: item.color,
                    backgroundColor: item.bg,
                  },
                ]}
                onPress={() => onChangeEstado(item.value)}
                disabled={actualizando || active}
                activeOpacity={0.85}
              >
                <View style={[styles.estadoOptionIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>

                <Text
                  style={[
                    styles.estadoOptionText,
                    active && { color: item.color },
                  ]}
                >
                  {item.label}
                </Text>

                {active ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={item.color}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}

          {actualizando ? (
            <View style={styles.updatingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.updatingText}>Actualizando...</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function FeedbackModal({ visible, tipo, titulo, mensaje, onClose }) {
  const config = {
    success: {
      icon: 'checkmark-circle-outline',
      color: '#16A34A',
      bg: '#DCFCE7',
      button: colors.primary,
      label: 'Aceptar',
    },
    error: {
      icon: 'alert-circle-outline',
      color: '#DC2626',
      bg: '#FEF2F2',
      button: '#DC2626',
      label: 'Entendido',
    },
    info: {
      icon: 'information-circle-outline',
      color: colors.primary,
      bg: '#EFF6FF',
      button: colors.primary,
      label: 'Aceptar',
    },
  };

  const item = config[tipo] || config.info;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.feedbackOverlay}>
        <View style={styles.feedbackCard}>
          <View style={[styles.feedbackIconBox, { backgroundColor: item.bg }]}>
            <Ionicons name={item.icon} size={32} color={item.color} />
          </View>

          <Text style={styles.feedbackTitle}>{titulo}</Text>
          <Text style={styles.feedbackMessage}>{mensaje}</Text>

          <TouchableOpacity
            style={[styles.feedbackBtn, { backgroundColor: item.button }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.feedbackBtnText}>{item.label}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function SkeletonReportes() {
  return (
    <View>
      <View style={styles.skeletonSummaryCard}>
        <View style={styles.skeletonLineSmall} />
        <View style={styles.skeletonLineLarge} />

        <View style={styles.skeletonStatusRow}>
          <View style={styles.skeletonStatusBox} />
          <View style={styles.skeletonStatusBox} />
          <View style={styles.skeletonStatusBox} />
        </View>
      </View>

      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonReportCard}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonCircle} />

            <View style={styles.skeletonTextBlock}>
              <View style={styles.skeletonReportTitle} />
              <View style={styles.skeletonReportSub} />
            </View>

            <View style={styles.skeletonBadge} />
          </View>

          <View style={styles.skeletonDescription} />
          <View style={styles.skeletonDescriptionShort} />
        </View>
      ))}
    </View>
  );
}

function formatearFecha(fechaTexto) {
  if (!fechaTexto) return 'Sin fecha';

  const fecha = new Date(fechaTexto);

  if (Number.isNaN(fecha.getTime())) {
    return 'Sin fecha';
  }

  return fecha.toLocaleDateString('es-EC', {
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

  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  summaryTitle: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    marginTop: 6,
    marginBottom: spacing.md,
  },

  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  statusBox: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },

  statusValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },

  statusLabel: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
    marginTop: 2,
    textAlign: 'center',
  },

  filterScroll: {
    marginBottom: spacing.lg,
  },

  filterContent: {
    gap: spacing.sm,
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
    marginBottom: spacing.md,
  },

  reportIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  reportTitleBox: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  reportCode: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  reportDate: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },

  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.full,
  },

  estadoText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },

  reportDescription: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  metaGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  metaItem: {
    flex: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  metaText: {
    flex: 1,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    textTransform: 'capitalize',
  },

  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  teacherText: {
    flex: 1,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
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

  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  estadoModalCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: spacing.xl,
  },

  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },

  estadoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  estadoModalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  estadoModalSub: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  estadoOption: {
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  estadoOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  estadoOptionText: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  updatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },

  updatingText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },

  feedbackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  feedbackCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  feedbackIconBox: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  feedbackTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  feedbackMessage: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  feedbackBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  feedbackBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },

  skeletonSummaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  skeletonStatusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  skeletonStatusBox: {
    flex: 1,
    height: 66,
    borderRadius: radius.md,
    backgroundColor: '#E5E7EB',
  },

  skeletonReportCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  skeletonCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E5E7EB',
    marginRight: spacing.sm,
  },

  skeletonTextBlock: {
    flex: 1,
  },

  skeletonLineSmall: {
    width: 100,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonLineLarge: {
    width: 150,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginTop: spacing.sm,
  },

  skeletonReportTitle: {
    width: '55%',
    height: 16,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },

  skeletonReportSub: {
    width: '35%',
    height: 12,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonBadge: {
    width: 86,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonDescription: {
    width: '90%',
    height: 14,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },

  skeletonDescriptionShort: {
    width: '65%',
    height: 14,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },
});