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

import { obtenerReservasAdmin } from '../../services/adminApi';

const CLERK_JWT_TEMPLATE = 'Axis';

const FILTROS = [
  { key: 'todas', label: 'Todas' },
  { key: 'activas', label: 'Activas' },
  { key: 'futuras', label: 'Futuras' },
  { key: 'finalizadas', label: 'Finalizadas' },
];

export default function AdminReservasScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('todas');

  const cargarReservas = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      setError('');

      const token = await getToken({
        template: CLERK_JWT_TEMPLATE,
      });

      const data = await obtenerReservasAdmin(token);

      setReservas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando reservas admin:', err);
      setError(err.message || 'No se pudieron cargar las reservas.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarReservas({ silencioso: true });
    }, [])
  );

  const obtenerEstadoReserva = (item) => {
    const reserva = item?.reserva || item;

    if (
      reserva?.liberada_anticipadamente === true ||
      reserva?.estado === 'liberada' ||
      reserva?.estado === 'cancelada'
    ) {
      return 'liberada';
    }

    const inicio = convertirFecha(reserva?.hora_inicio);
    const fin = convertirFecha(reserva?.hora_fin);

    if (!inicio || !fin) {
      return 'sin_horario';
    }

    const ahora = new Date();

    if (fin <= inicio) {
      return 'liberada';
    }

    if (ahora >= inicio && ahora <= fin) {
      return 'activa';
    }

    if (ahora < inicio) {
      return 'futura';
    }

    return 'finalizada';
  };

  const reservasActivas = reservas.filter(
    (item) => obtenerEstadoReserva(item) === 'activa'
  ).length;

  const reservasFuturas = reservas.filter(
    (item) => obtenerEstadoReserva(item) === 'futura'
  ).length;

  const reservasFinalizadas = reservas.filter(
    (item) => obtenerEstadoReserva(item) === 'finalizada'
  ).length;

  const reservasLiberadas = reservas.filter(
    (item) => obtenerEstadoReserva(item) === 'liberada'
  ).length;

  const reservasFiltradas = reservas.filter((item) => {
    const estado = obtenerEstadoReserva(item);

    if (filtroActivo === 'todas') {
      return estado !== 'liberada';
    }

    if (filtroActivo === 'activas') {
      return estado === 'activa';
    }

    if (filtroActivo === 'futuras') {
      return estado === 'futura';
    }

    if (filtroActivo === 'finalizadas') {
      return estado === 'finalizada';
    }

    return true;
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader
        rol="admin"
        onNotifPress={() => cargarReservas({ silencioso: false })}
        onProfilePress={() => router.push('/(admin)/perfil')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleTextBox}>
            <Text style={styles.title}>Reservas</Text>
            <Text style={styles.subtitle}>
              Control de reservas activas, futuras y finalizadas.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => cargarReservas({ silencioso: false })}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <SkeletonReservas />
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryGrid}>
              <SummaryCard
                icon="calendar-outline"
                label="Total"
                value={reservas.length}
                color={colors.primary}
                bg="#EFF6FF"
              />

              <SummaryCard
                icon="radio-button-on-outline"
                label="Activas"
                value={reservasActivas}
                color="#16A34A"
                bg="#DCFCE7"
              />

              <SummaryCard
                icon="time-outline"
                label="Futuras"
                value={reservasFuturas}
                color="#D97706"
                bg="#FEF3C7"
              />

              <SummaryCard
                icon="checkmark-done-outline"
                label="Finalizadas"
                value={reservasFinalizadas}
                color="#6B7280"
                bg="#F3F4F6"
              />
            </View>

            {reservasLiberadas > 0 ? (
              <View style={styles.noticeCard}>
                <Ionicons name="exit-outline" size={18} color="#DC2626" />
                <Text style={styles.noticeText}>
                  {reservasLiberadas} reserva
                  {reservasLiberadas === 1 ? '' : 's'} liberada
                  {reservasLiberadas === 1 ? '' : 's'} no se muestra
                  {reservasLiberadas === 1 ? '' : 'n'} en el listado principal.
                </Text>
              </View>
            ) : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContent}
              style={styles.filterScroll}
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
              <Text style={styles.sectionTitle}>Listado de reservas</Text>
              <Text style={styles.sectionCounter}>
                {reservasFiltradas.length} registros
              </Text>
            </View>

            {reservasFiltradas.length > 0 ? (
              reservasFiltradas.map((item, index) => (
                <ReservaCard
                  key={item?.reserva?.id || item?.id || index}
                  item={item}
                  estado={obtenerEstadoReserva(item)}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="file-tray-outline"
                  size={34}
                  color={colors.textMuted}
                />

                <Text style={styles.emptyTitle}>Sin reservas</Text>
                <Text style={styles.emptyText}>
                  No hay reservas registradas para este filtro.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReservaCard({ item, estado }) {
  const reserva = item?.reserva || item;
  const espacio = item?.espacio || reserva?.espacio || {};

  const config = {
    activa: {
      label: 'Activa',
      color: '#16A34A',
      bg: '#DCFCE7',
      icon: 'radio-button-on-outline',
    },
    futura: {
      label: 'Futura',
      color: '#D97706',
      bg: '#FEF3C7',
      icon: 'time-outline',
    },
    finalizada: {
      label: 'Finalizada',
      color: '#6B7280',
      bg: '#F3F4F6',
      icon: 'checkmark-done-outline',
    },
    liberada: {
      label: 'Liberada',
      color: '#DC2626',
      bg: '#FEF2F2',
      icon: 'exit-outline',
    },
    sin_horario: {
      label: 'Sin horario',
      color: '#D97706',
      bg: '#FEF3C7',
      icon: 'warning-outline',
    },
  }[estado];

  return (
    <View style={styles.reservaCard}>
      <View style={styles.reservaHeader}>
        <View style={styles.reservaIconBox}>
          <Ionicons name="calendar-outline" size={22} color={colors.primary} />
        </View>

        <View style={styles.reservaTextBox}>
          <Text style={styles.reservaTitle} numberOfLines={1}>
            {reserva?.materia || 'Reserva sin materia'}
          </Text>

          <Text style={styles.reservaSubtitle} numberOfLines={1}>
            {espacio?.nombre || reserva?.espacio_nombre || 'Aula no registrada'}
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
          icon="time-outline"
          label="Horario"
          value={formatHorario(reserva?.hora_inicio, reserva?.hora_fin)}
        />

        <DetailItem
          icon="business-outline"
          label="Ubicación"
          value={
            espacio?.ubicacion ||
            espacio?.bloque ||
            reserva?.espacio_bloque ||
            '—'
          }
        />
      </View>

      <View style={styles.bottomInfo}>
        <View style={styles.bottomItem}>
          <Ionicons
            name="person-outline"
            size={15}
            color={colors.textSecondary}
          />

          <Text style={styles.bottomText} numberOfLines={1}>
            {reserva?.docente_nombre || 'Docente no registrado'}
          </Text>
        </View>

        <View style={styles.bottomItem}>
          <Ionicons
            name="layers-outline"
            size={15}
            color={colors.textSecondary}
          />

          <Text style={styles.bottomText} numberOfLines={1}>
            {espacio?.bloque || reserva?.espacio_bloque || 'Sin bloque'}
          </Text>
        </View>
      </View>
    </View>
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

function SkeletonReservas() {
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
          </View>
        </View>
      ))}
    </View>
  );
}

function convertirFecha(fechaTexto) {
  if (!fechaTexto) return null;

  const fecha = new Date(fechaTexto);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function formatHorario(isoInicio, isoFin) {
  if (!isoInicio || !isoFin) return 'N/A';

  const inicio = convertirFecha(isoInicio);
  const fin = convertirFecha(isoFin);

  if (!inicio || !fin) return 'N/A';

  const opciones = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  return `${inicio.toLocaleTimeString([], opciones)} – ${fin.toLocaleTimeString(
    [],
    opciones
  )}`;
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

  noticeCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },

  noticeText: {
    flex: 1,
    fontSize: typography.size.xs,
    color: '#DC2626',
    lineHeight: 17,
    fontWeight: typography.weight.semibold,
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

  reservaCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  reservaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  reservaIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  reservaTextBox: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  reservaTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  reservaSubtitle: {
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

  bottomInfo: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  bottomItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  bottomText: {
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