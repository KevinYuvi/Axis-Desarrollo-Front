import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '../../src/shared/hooks/useClerkOrMock';
import { colors } from '../../src/shared/theme/colors';
import { typography } from '../../src/shared/theme/typography';
import { spacing, radius } from '../../src/shared/theme/spacing';
import { AppHeader } from '../../src/shared/components';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ESTADO_CONFIG = {
  activa:    { bg: '#F0FDF4', text: '#16A34A', label: 'Activa',    icon: 'checkmark-circle-outline' },
  pendiente: { bg: '#FFF7ED', text: '#D97706', label: 'Pendiente', icon: 'time-outline' },
  cancelada: { bg: '#FEF2F2', text: colors.danger, label: 'Cancelada', icon: 'close-circle-outline' },
};

export default function ReservasScreen() {
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const [clasesHoy, setClasesHoy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  if (!authLoaded || !userLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'estudiante';

  // Docentes tienen endpoint propio; otros roles ven un mensaje informativo
  const esDocente = rol === 'docente' || rol === 'admin';

  const cargarClases = useCallback(async (silencioso = false) => {
    if (!esDocente) {
      setLoading(false);
      return;
    }

    try {
      if (!silencioso) setLoading(true);
      const token = await getToken();

      const res = await fetch(`${API_URL}/api/v1/reservas/mis-clases-hoy`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Error al cargar el cronograma');

      setClasesHoy(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo cargar el cronograma.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, esDocente]);

  useEffect(() => { cargarClases(); }, [cargarClases]);

  const formatHorario = (inicio, fin) => {
    if (!inicio || !fin) return 'Horario no disponible';
    const opts = { hour: '2-digit', minute: '2-digit', hour12: false };
    return `${new Date(inicio).toLocaleTimeString([], opts)} – ${new Date(fin).toLocaleTimeString([], opts)}`;
  };

  const formatFecha = (isoStr) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleDateString('es-EC', {
      weekday: 'long', day: '2-digit', month: 'long',
    });
  };

  const ahora = new Date();
  const hoy = formatFecha(ahora.toISOString());

  // ── Pantalla para roles que no son docentes ──────────────────────────
  if (!esDocente) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <StatusBar style="dark" />
        <AppHeader rol={rol} />
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={52} color={colors.primary} />
          <Text style={styles.emptyTitle}>Sin reservas activas</Text>
          <Text style={styles.emptyMsg}>
            Las reservas de aulas son gestionadas por los docentes.
            {'\n'}Consulta el Asistente IA para saber dónde se dicta tu clase.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Pantalla para Docente / Admin ────────────────────────────────────
  const renderClase = ({ item }) => {
    const { reserva, espacio } = item;
    const inicioMs = new Date(reserva?.hora_inicio).getTime();
    const finMs = new Date(reserva?.hora_fin).getTime();
    const ahoraMs = ahora.getTime();
    const activa = ahoraMs >= inicioMs && ahoraMs <= finMs;

    const estadoCfg = activa
      ? ESTADO_CONFIG.activa
      : ahoraMs < inicioMs
        ? ESTADO_CONFIG.pendiente
        : ESTADO_CONFIG.cancelada;

    return (
      <View style={[styles.card, activa && styles.cardActiva]}>
        {activa && (
          <View style={styles.enCursoStrip}>
            <Text style={styles.enCursoText}>⚡ EN CURSO</Text>
          </View>
        )}

        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.aulaName}>{espacio?.nombre || 'Aula'}</Text>
            <Text style={styles.ubicacion}>📍 {espacio?.ubicacion || 'Ubicación no registrada'}</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: estadoCfg.bg }]}>
            <Ionicons name={estadoCfg.icon} size={13} color={estadoCfg.text} />
            <Text style={[styles.estadoText, { color: estadoCfg.text }]}>{estadoCfg.label}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Materia</Text>
            <Text style={styles.infoValue}>{reserva?.materia || 'Sin materia'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Horario</Text>
            <Text style={styles.infoValue}>{formatHorario(reserva?.hora_inicio, reserva?.hora_fin)}</Text>
          </View>
          {espacio?.capacidad && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Capacidad</Text>
              <Text style={styles.infoValue}>{espacio.capacidad} personas</Text>
            </View>
          )}
          {espacio?.equipamiento && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Equipo</Text>
              <Text style={styles.infoValue}>{espacio.equipamiento}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <AppHeader rol={rol} onNotifPress={() => cargarClases(true)} />

      {/* Encabezado de fecha */}
      <View style={styles.dateStrip}>
        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
        <Text style={styles.dateText}>{hoy}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={clasesHoy}
          keyExtractor={(item, idx) => item?.reserva?.id || String(idx)}
          renderItem={renderClase}
          contentContainerStyle={
            clasesHoy.length === 0 ? styles.emptyContainer : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); cargarClases(true); }}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            clasesHoy.length > 0 ? (
              <Text style={styles.sectionTitle}>
                {clasesHoy.length} clase{clasesHoy.length !== 1 ? 's' : ''} programada{clasesHoy.length !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin clases hoy</Text>
              <Text style={styles.emptyMsg}>
                No tienes clases programadas para el día de hoy.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  dateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  dateText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardActiva: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  enCursoStrip: {
    backgroundColor: colors.primary,
    paddingVertical: 4,
    alignItems: 'center',
  },
  enCursoText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: typography.weight.bold,
    letterSpacing: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  cardLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  aulaName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  ubicacion: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  infoGrid: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: typography.weight.bold,
  },
  infoValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyMsg: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});