import React, { useCallback, useState } from 'react';
import {
  Alert,
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
import { crearConexionRealtime } from '../../../../shared/realtime/realtimeClient';
import {
  liberarReservaAdmin,
  obtenerReservasAdmin,
} from '../../services/adminApi';

import ReservaCard from '../components/reservas/ReservaCard';
import ReservaSummaryCompact from '../components/reservas/ReservaSummaryCompact';
import SkeletonReservas from '../components/reservas/SkeletonReservas';

const CLERK_JWT_TEMPLATE = 'Axis';

const FILTROS = [
  { key: 'todas', label: 'Todas' },
  { key: 'activas', label: 'Activas' },
  { key: 'futuras', label: 'Futuras' },
];

export default function AdminReservasScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('todas');
  const [liberandoId, setLiberandoId] = useState(null);

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

  const cargarReservas = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      setError('');

      const token = await obtenerTokenActual();
      const data = await obtenerReservasAdmin(token);
      console.log('RESERVAS ADMIN:', JSON.stringify(data, null, 2));
      setReservas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando reservas admin:', err);
      setError(err.message || 'No se pudieron cargar las reservas.');
    } finally {
      setLoading(false);
    }
  };

  const liberarReserva = async (reserva) => {
    const reservaId = reserva?.id;

    if (!reservaId) {
      Alert.alert('Reserva no válida', 'No se pudo identificar la reserva.');
      return;
    }

    Alert.alert(
      'Liberar aula',
      '¿Seguro que deseas liberar esta aula? La reserva quedará marcada como liberada.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Liberar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLiberandoId(reservaId);

              const token = await obtenerTokenActual();

              await liberarReservaAdmin(token, reservaId);

              await cargarReservas({ silencioso: true });
            } catch (err) {
              console.error('Error liberando reserva admin:', err);

              Alert.alert(
                'No se pudo liberar',
                err.message || 'Ocurrió un error al liberar la reserva.'
              );
            } finally {
              setLiberandoId(null);
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      cargarReservas({ silencioso: true });

      const realtime = crearConexionRealtime({
        onEvento: (evento) => {
          if (
            evento.tipo === 'reservas_actualizadas' ||
            evento.tipo === 'aulas_actualizadas' ||
            evento.tipo === 'dashboard_actualizado'
          ) {
            cargarReservas({ silencioso: true });
          }
        },
      });

      return () => {
        realtime?.cerrar();
      };
    }, [])
  );

  const reservasActivas = reservas.filter(
    (item) => obtenerEstadoReserva(item) === 'activa'
  ).length;

  const reservasFuturas = reservas.filter(
    (item) => obtenerEstadoReserva(item) === 'futura'
  ).length;

  const reservasVigentes = reservas.filter((item) => {
    const estado = obtenerEstadoReserva(item);
    return estado === 'activa' || estado === 'futura';
  });

  const reservasFiltradas = reservas.filter((item) => {
    const estado = obtenerEstadoReserva(item);

    if (filtroActivo === 'todas') {
      return estado === 'activa' || estado === 'futura';
    }

    if (filtroActivo === 'activas') {
      return estado === 'activa';
    }

    if (filtroActivo === 'futuras') {
      return estado === 'futura';
    }

    return false;
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
              Control de reservas activas y próximas.
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

            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => cargarReservas({ silencioso: false })}
              activeOpacity={0.85}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ReservaSummaryCompact
              total={reservasVigentes.length}
              activas={reservasActivas}
              futuras={reservasFuturas}
            />

            <View style={styles.filterWrap}>
              {FILTROS.map((item) => {
                const active = filtroActivo === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
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
              <Text style={styles.sectionTitle}>Listado de reservas</Text>

              <Text style={styles.sectionCounter}>
                {reservasFiltradas.length} registros
              </Text>
            </View>

            {reservasFiltradas.length > 0 ? (
              reservasFiltradas.map((item, index) => {
                const reserva = item?.reserva || item;
                const reservaId = reserva?.id || String(index);

                return (
                  <ReservaCard
                    key={reservaId}
                    item={item}
                    estado={obtenerEstadoReserva(item)}
                    onLiberar={liberarReserva}
                    liberando={liberandoId === reservaId}
                  />
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="file-tray-outline"
                  size={34}
                  color={colors.textMuted}
                />

                <Text style={styles.emptyTitle}>Sin reservas vigentes</Text>

                <Text style={styles.emptyText}>
                  No hay reservas activas o futuras para este filtro.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function obtenerEstadoReserva(item) {
  const reserva = item?.reserva || item;

  if (
    reserva?.liberada_anticipadamente === true ||
    reserva?.estado === 'liberada'
  ) {
    return 'liberada';
  }

  if (reserva?.estado === 'cancelada') {
    return 'cancelada';
  }

  // Primero usar el estado calculado por el backend
  if (reserva?.estado_tiempo) {
    return reserva.estado_tiempo;
  }

  // Respaldo por si alguna reserva vieja no trae estado_tiempo
  const inicio = convertirFecha(reserva?.hora_inicio);
  const fin = convertirFecha(reserva?.hora_fin);

  if (!inicio || !fin) {
    return 'sin_horario';
  }

  const ahora = new Date();

  if (ahora >= inicio && ahora <= fin) {
    return 'activa';
  }

  if (ahora < inicio) {
    return 'futura';
  }

  return 'finalizada';
}

function convertirFecha(fechaTexto) {
  if (!fechaTexto) return null;

  const fecha = new Date(fechaTexto);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
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

  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
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