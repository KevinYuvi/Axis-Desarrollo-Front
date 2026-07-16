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
import { crearConexionRealtime } from '../../../../shared/realtime/realtimeClient';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader } from '../../../../shared/components';

import { obtenerResumenAdmin } from '../../services/adminApi';

const CLERK_JWT_TEMPLATE = 'Axis';

export default function AdminHomeScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [resumen, setResumen] = useState({
    totalAulas: 0,
    aulasDisponibles: 0,
    aulasOcupadas: 0,
    aulasMantenimiento: 0,
    totalReservas: 0,
    totalReportes: 0,
    reportesAbiertos: 0,
    reportesEnProceso: 0,
    reportesResueltos: 0,
  });

  const [reportes, setReportes] = useState([]);
  const [reservas, setReservas] = useState([]);

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

  const cargarResumen = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      setError('');

      const token = await obtenerTokenActual();
      const data = await obtenerResumenAdmin(token);

      setResumen(data?.resumen || {});
      setReportes(Array.isArray(data?.reportes) ? data.reportes : []);
      setReservas(Array.isArray(data?.reservas) ? data.reservas : []);
    } catch (err) {
      console.error('Error cargando resumen admin:', err);
      setError(err.message || 'No se pudo cargar el resumen.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarResumen({ silencioso: true });

      const realtime = crearConexionRealtime({
        onEvento: (evento) => {
          if (
            evento.tipo === 'dashboard_actualizado' ||
            evento.tipo === 'reservas_actualizadas' ||
            evento.tipo === 'aulas_actualizadas' ||
            evento.tipo === 'reportes_actualizados'
          ) {
            cargarResumen({ silencioso: true });
          }
        },
      });

      return () => {
        realtime?.cerrar();
      };
    }, [])
  );

  const totalAulas = Number(resumen.totalAulas || 0);
  const aulasDisponibles = Number(resumen.aulasDisponibles || 0);
  const aulasOcupadas = Number(resumen.aulasOcupadas || 0);
  const aulasMantenimiento = Number(resumen.aulasMantenimiento || 0);

  const totalReportes = Number(resumen.totalReportes || 0);
  const reportesAbiertos = Number(resumen.reportesAbiertos || 0);
  const reportesEnProceso = Number(resumen.reportesEnProceso || 0);
  const reportesResueltos = Number(resumen.reportesResueltos || 0);
  const reportesPendientes = reportesAbiertos + reportesEnProceso;

  const reportesBaja = reportes.filter(
    (item) => item.gravedad === 'baja'
  ).length;

  const reportesMedia = reportes.filter(
    (item) => item.gravedad === 'media'
  ).length;

  const reportesAlta = reportes.filter(
    (item) => item.gravedad === 'alta'
  ).length;

  const reservasHoyVigentes = reservas.filter((item) =>
    esReservaDeHoyVigente(item)
  );

  const reservasHoyActivas = reservasHoyVigentes.filter(
    (item) => obtenerEstadoReserva(item) === 'activa'
  ).length;

  const reservasHoyFuturas = reservasHoyVigentes.filter(
    (item) => obtenerEstadoReserva(item) === 'futura'
  ).length;

  const totalReservasHoy = reservasHoyVigentes.length;

  const porcentajeBaja = calcularPorcentaje(reportesBaja, totalReportes);
  const porcentajeMedia = calcularPorcentaje(reportesMedia, totalReportes);
  const porcentajeAlta = calcularPorcentaje(reportesAlta, totalReportes);

  const porcentajeDisponibles = calcularPorcentaje(aulasDisponibles, totalAulas);
  const porcentajeOcupadas = calcularPorcentaje(aulasOcupadas, totalAulas);
  const porcentajeMantenimiento = calcularPorcentaje(
    aulasMantenimiento,
    totalAulas
  );

  const estadoReportes =
    reportesPendientes > 0
      ? 'Hay reportes pendientes'
      : 'Sin reportes pendientes';

  const estadoReportesColor =
    reportesPendientes > 0 ? '#D97706' : '#16A34A';

  const estadoReportesBg =
    reportesPendientes > 0 ? '#FEF3C7' : '#DCFCE7';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader
        rol="admin"
        onNotifPress={() => cargarResumen({ silencioso: false })}
        onProfilePress={() => router.push('/(admin)/perfil')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleTextBox}>
            <Text style={styles.title}>Panel administrativo</Text>
            <Text style={styles.subtitle}>
              Revisión rápida de incidencias, reservas y aulas.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => cargarResumen({ silencioso: false })}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <LoadingCard />
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />

            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => cargarResumen({ silencioso: false })}
              activeOpacity={0.85}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.priorityCard}>
              <View style={styles.priorityHeader}>
                <View
                  style={[
                    styles.priorityIconBox,
                    { backgroundColor: estadoReportesBg },
                  ]}
                >
                  <Ionicons
                    name={
                      reportesPendientes > 0
                        ? 'alert-circle-outline'
                        : 'checkmark-circle-outline'
                    }
                    size={24}
                    color={estadoReportesColor}
                  />
                </View>

                <View style={styles.priorityTextBox}>
                  <Text style={styles.priorityLabel}>Prioridad del día</Text>
                  <Text style={styles.priorityTitle}>{estadoReportes}</Text>
                </View>
              </View>

              <View style={styles.pendingBox}>
                <Text
                  style={[
                    styles.pendingNumber,
                    { color: estadoReportesColor },
                  ]}
                >
                  {reportesPendientes}
                </Text>

                <Text style={styles.pendingText}>
                  reporte{reportesPendientes === 1 ? '' : 's'} por atender
                </Text>
              </View>

              <View style={styles.reportStatusRow}>
                <StatusMini
                  label="Abiertos"
                  value={reportesAbiertos}
                  color="#D97706"
                  bg="#FEF3C7"
                />

                <StatusMini
                  label="En proceso"
                  value={reportesEnProceso}
                  color={colors.primary}
                  bg="#EFF6FF"
                />

                <StatusMini
                  label="Resueltos"
                  value={reportesResueltos}
                  color="#16A34A"
                  bg="#DCFCE7"
                />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Gravedad de reportes</Text>
                  <Text style={styles.cardSubtitle}>
                    Clasificación de tickets según prioridad.
                  </Text>
                </View>

                <View style={styles.totalChip}>
                  <Text style={styles.totalChipText}>{totalReportes} total</Text>
                </View>
              </View>

              <ProgressRow
                label="Baja"
                value={reportesBaja}
                percent={porcentajeBaja}
                color="#16A34A"
              />

              <ProgressRow
                label="Media"
                value={reportesMedia}
                percent={porcentajeMedia}
                color={colors.primary}
              />

              <ProgressRow
                label="Alta"
                value={reportesAlta}
                percent={porcentajeAlta}
                color="#D97706"
                isLast
              />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Reservas de hoy</Text>
                  <Text style={styles.cardSubtitle}>
                    Reservas activas o próximas del día.
                  </Text>
                </View>

                <View style={styles.todayChip}>
                  <Text style={styles.todayChipText}>Hoy</Text>
                </View>
              </View>

              <View style={styles.reservasMainBox}>
                <View style={styles.reservasIconBox}>
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.reservasTextBox}>
                  <Text style={styles.reservasValue}>{totalReservasHoy}</Text>
                  <Text style={styles.reservasLabel}>
                    reservas vigentes hoy
                  </Text>
                </View>
              </View>

              <View style={styles.reservasStatusRow}>
                <ReservaMini
                  label="Activas"
                  value={reservasHoyActivas}
                  color="#16A34A"
                  bg="#DCFCE7"
                />

                <ReservaMini
                  label="Próximas"
                  value={reservasHoyFuturas}
                  color={colors.primary}
                  bg="#EFF6FF"
                />
              </View>

              <View style={styles.reservasNoteBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={colors.textSecondary}
                />

                <Text style={styles.reservasHint}>
                  No se incluyen reservas finalizadas, liberadas ni canceladas.
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Aulas</Text>
                  <Text style={styles.cardSubtitle}>
                    Disponibilidad actual de espacios.
                  </Text>
                </View>

                <View style={styles.totalChip}>
                  <Text style={styles.totalChipText}>{totalAulas} total</Text>
                </View>
              </View>

              <View style={styles.aulasMainRow}>
                <View style={styles.aulasBigBox}>
                  <Text style={styles.aulasBigNumber}>{aulasDisponibles}</Text>
                  <Text style={styles.aulasBigLabel}>disponibles</Text>
                </View>

                <View style={styles.aulasTextBox}>
                  <Text style={styles.aulasTitle}>
                    {porcentajeDisponibles}% libres
                  </Text>

                  <Text style={styles.aulasDescription}>
                    {aulasOcupadas} ocupada
                    {aulasOcupadas === 1 ? '' : 's'} y {aulasMantenimiento} en
                    mantenimiento.
                  </Text>
                </View>
              </View>

              <View style={styles.stackBar}>
                <View
                  style={[
                    styles.stackSegment,
                    {
                      flex: aulasDisponibles || 0.01,
                      backgroundColor: '#16A34A',
                    },
                  ]}
                />

                <View
                  style={[
                    styles.stackSegment,
                    {
                      flex: aulasOcupadas || 0.01,
                      backgroundColor: '#D97706',
                    },
                  ]}
                />

                <View
                  style={[
                    styles.stackSegment,
                    {
                      flex: aulasMantenimiento || 0.01,
                      backgroundColor: '#DC2626',
                    },
                  ]}
                />
              </View>

              <View style={styles.legendGrid}>
                <LegendItem
                  label="Disponibles"
                  value={aulasDisponibles}
                  percent={porcentajeDisponibles}
                  color="#16A34A"
                />

                <LegendItem
                  label="Ocupadas"
                  value={aulasOcupadas}
                  percent={porcentajeOcupadas}
                  color="#D97706"
                />

                <LegendItem
                  label="Mantenimiento"
                  value={aulasMantenimiento}
                  percent={porcentajeMantenimiento}
                  color="#DC2626"
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LoadingCard() {
  return (
    <View style={styles.loadingCard}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={styles.loadingText}>Cargando información...</Text>
    </View>
  );
}

function StatusMini({ label, value, color, bg }) {
  return (
    <View style={[styles.statusMini, { backgroundColor: bg }]}>
      <Text style={[styles.statusMiniValue, { color }]}>{value}</Text>
      <Text style={[styles.statusMiniLabel, { color }]}>{label}</Text>
    </View>
  );
}

function ReservaMini({ label, value, color, bg }) {
  return (
    <View style={[styles.reservaMini, { backgroundColor: bg }]}>
      <Text style={[styles.reservaMiniValue, { color }]}>{value}</Text>
      <Text style={[styles.reservaMiniLabel, { color }]}>{label}</Text>
    </View>
  );
}

function ProgressRow({ label, value, percent, color, isLast = false }) {
  return (
    <View style={[styles.progressRow, isLast && styles.progressRowLast]}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>

        <Text style={styles.progressValue}>
          {value} · {percent}%
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.max(percent, value > 0 ? 7 : 0)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function LegendItem({ label, value, percent, color }) {
  return (
    <View style={styles.legendItem}>
      <View style={styles.legendTop}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>{label}</Text>
      </View>

      <Text style={styles.legendValue}>
        {value} · {percent}%
      </Text>
    </View>
  );
}

function obtenerEstadoReserva(item) {
  const reserva = item?.reserva || item;

  if (
    reserva?.liberada_anticipadamente === true ||
    reserva?.estado === 'liberada' ||
    reserva?.estado === 'cancelada'
  ) {
    return 'no_vigente';
  }

  const inicio = convertirFecha(reserva?.hora_inicio);
  const fin = convertirFecha(reserva?.hora_fin);

  if (!inicio || !fin) {
    return 'no_vigente';
  }

  const ahora = new Date();

  if (fin <= ahora) {
    return 'finalizada';
  }

  if (ahora >= inicio && ahora <= fin) {
    return 'activa';
  }

  if (ahora < inicio) {
    return 'futura';
  }

  return 'no_vigente';
}

function esReservaDeHoyVigente(item) {
  const reserva = item?.reserva || item;
  const inicio = convertirFecha(reserva?.hora_inicio);
  const estado = obtenerEstadoReserva(item);

  if (!inicio) return false;

  const hoy = new Date();

  const esHoy =
    inicio.getFullYear() === hoy.getFullYear() &&
    inicio.getMonth() === hoy.getMonth() &&
    inicio.getDate() === hoy.getDate();

  return esHoy && (estado === 'activa' || estado === 'futura');
}

function convertirFecha(fechaTexto) {
  if (!fechaTexto) return null;

  const fecha = new Date(fechaTexto);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function calcularPorcentaje(valor, total) {
  const numero = Number(valor || 0);
  const totalNumero = Number(total || 0);

  if (totalNumero <= 0) return 0;

  return Math.round((numero / totalNumero) * 100);
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    lineHeight: 19,
  },

  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
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

  priorityCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  priorityIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  priorityTextBox: {
    flex: 1,
  },

  priorityLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  priorityTitle: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    marginTop: 2,
  },

  pendingBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  pendingNumber: {
    fontSize: 34,
    fontWeight: typography.weight.bold,
  },

  pendingText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    marginTop: 2,
  },

  reportStatusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  statusMini: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },

  statusMiniValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },

  statusMiniLabel: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    marginTop: 2,
    textAlign: 'center',
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  cardHeaderText: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  cardSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },

  totalChip: {
    borderRadius: radius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  totalChipText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },

  todayChip: {
    borderRadius: radius.full,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  todayChipText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },

  progressRow: {
    marginBottom: spacing.md,
  },

  progressRowLast: {
    marginBottom: 0,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  progressLabel: {
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  progressValue: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },

  progressTrack: {
    height: 10,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },

  reservasMainBox: {
    minHeight: 92,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  reservasIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  reservasTextBox: {
    flex: 1,
  },

  reservasValue: {
    fontSize: 30,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  reservasLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    marginTop: -1,
  },

  reservasStatusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  reservaMini: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },

  reservaMiniValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },

  reservaMiniLabel: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    marginTop: 2,
    textAlign: 'center',
  },

  reservasNoteBox: {
    minHeight: 42,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },

  reservasHint: {
    flex: 1,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    lineHeight: 17,
    marginLeft: spacing.xs,
  },

  aulasMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  aulasBigBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  aulasBigNumber: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
    color: '#16A34A',
  },

  aulasBigLabel: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: typography.weight.bold,
    marginTop: 1,
  },

  aulasTextBox: {
    flex: 1,
  },

  aulasTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  aulasDescription: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },

  stackBar: {
    height: 12,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },

  stackSegment: {
    height: '100%',
  },

  legendGrid: {
    gap: spacing.sm,
  },

  legendItem: {
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  legendTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: spacing.xs,
  },

  legendLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },

  legendValue: {
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },
});