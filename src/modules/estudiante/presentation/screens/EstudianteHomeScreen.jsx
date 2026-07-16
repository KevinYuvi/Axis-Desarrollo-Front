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
import { crearConexionRealtime } from '../../../../shared/realtime/realtimeClient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

import AppHeader from '../../../../shared/components/organisms/AppHeader';
import {
  obtenerMisClasesHoy,
  obtenerProximaClase,
} from '../../services/estudianteApi';
import { getOccupancySpaces } from '../../../../shared/services/occupancyApi';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const CLERK_JWT_TEMPLATE = 'Axis';

export default function EstudianteHomeScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clasesHoy, setClasesHoy] = useState([]);
  const [claseActual, setClaseActual] = useState(null);
  const [proximaClase, setProximaClase] = useState(null);
  const [biblioteca, setBiblioteca] = useState(null);
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

  const cargarDatos = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      setError('');

      const token = await obtenerTokenAxis();

      const [clasesRes, proximaRes, ocupacionRes] = await Promise.allSettled([
        obtenerMisClasesHoy({ token }),
        obtenerProximaClase({ token }),
        getOccupancySpaces(),
      ]);

      const clases =
        clasesRes.status === 'fulfilled' && Array.isArray(clasesRes.value?.data)
          ? clasesRes.value.data
          : [];

      const proxima =
        proximaRes.status === 'fulfilled'
          ? proximaRes.value?.data || null
          : null;

      const espacios =
        ocupacionRes.status === 'fulfilled' && Array.isArray(ocupacionRes.value?.data)
          ? ocupacionRes.value.data
          : [];

      const actual = clases.find((item) => item.estado === 'actual') || null;

      const siguiente =
        proxima?.estado === 'actual'
          ? null
          : proxima || clases.find((item) => item.estado === 'proxima') || null;

      const espaciosConDatos = espacios.filter(
        (item) =>
          item.occupancyPercent !== null &&
          item.occupancyPercent !== undefined
      );

      const bibliotecas = espaciosConDatos.filter((item) => {
        const texto = `${item.name || ''} ${item.nombre || ''} ${item.type || ''
          } ${item.tipo || ''}`.toLowerCase();

        return texto.includes('biblioteca');
      });

      const candidatos = (bibliotecas.length > 0 ? bibliotecas : espaciosConDatos)
        .filter((item) => item.status !== 'Ocupado' && item.status !== 'Sin datos')
        .sort((a, b) => {
          if (a.occupancyPercent !== b.occupancyPercent) {
            return a.occupancyPercent - b.occupancyPercent;
          }

          return (a.distanceMinutes || 999) - (b.distanceMinutes || 999);
        });

      setClasesHoy(clases);
      setClaseActual(actual);
      setProximaClase(siguiente);
      setBiblioteca(candidatos[0] || null);
    } catch (err) {
      console.error('Error cargando home estudiante:', err);
      setError(err?.message || 'No se pudo cargar el inicio.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos({ silencioso: true });

      const realtime = crearConexionRealtime({
        onEvento: (evento) => {
          if (
            evento.tipo === 'reservas_actualizadas' ||
            evento.tipo === 'aulas_actualizadas' ||
            evento.tipo === 'reportes_actualizados' ||
            evento.tipo === 'ocupacion_actualizada'
          ) {
            cargarDatos({ silencioso: true });
          }
        },
      });

      return () => {
        realtime?.cerrar();
      };
    }, [])
  );

  const refrescar = () => {
    setRefreshing(true);
    cargarDatos({ silencioso: true });
  };

  const irDetalleClase = (clase) => {
    if (!clase?.id) return;

    router.push({
      pathname: '/(estudiante)/clase/[claseId]',
      params: {
        claseId: clase.id,
      },
    });
  };

  const irBibliotecas = () => {
    router.push('/(estudiante)/bibliotecas');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader
        rol="estudiante"
        onNotifPress={refrescar}
        onProfilePress={() => router.push('/(estudiante)/perfil')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refrescar} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState mensaje={error} onRetry={refrescar} />
        ) : (
          <>
            <View style={styles.headerCard}>
              <View style={styles.headerTextBox}>
                <Text style={styles.headerTitle}>Tu actividad de hoy</Text>
                <Text style={styles.headerSubtitle}>
                  {clasesHoy.length > 0
                    ? `${clasesHoy.length} ${clasesHoy.length === 1 ? 'clase registrada' : 'clases registradas'
                    } para hoy.`
                    : 'No tienes clases registradas para hoy.'}
                </Text>
              </View>

              <View style={styles.dateChip}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={15}
                  color={colors.primary}
                />
                <Text style={styles.dateChipText}>{formatearFechaCorta()}</Text>
              </View>
            </View>

            <SectionTitle
              icon="radio-button-on-outline"
              title="Clase actual"
              subtitle="Aula donde deberías estar ahora"
            />

            {claseActual ? (
              <ClaseActualCard
                clase={claseActual}
                onPress={() => irDetalleClase(claseActual)}
              />
            ) : (
              <EmptyCard
                icon="school-outline"
                title="Sin clase activa"
                text="Cuando estés dentro del horario de una materia, aparecerá aquí tu aula actual."
              />
            )}

            <SectionTitle
              icon="time-outline"
              title="Próxima clase"
              subtitle="Tu siguiente materia programada"
            />

            {proximaClase ? (
              <ProximaClaseCard
                clase={proximaClase}
                onPress={() => irDetalleClase(proximaClase)}
              />
            ) : (
              <EmptyCard
                icon="calendar-outline"
                title="Sin próximas clases"
                text="No tienes otra clase pendiente para hoy."
              />
            )}

            <SectionTitle
              icon="library-outline"
              title="Biblioteca"
              subtitle="Espacio sugerido para estudiar"
            />

            {biblioteca ? (
              <BibliotecaCard espacio={biblioteca} onPress={irBibliotecas} />
            ) : (
              <EmptyCard
                icon="library-outline"
                title="Sin información disponible"
                text="Aún no hay datos de ocupación de la biblioteca."
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>

      <View style={styles.sectionTextBox}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ClaseActualCard({ clase, onPress }) {
  return (
    <TouchableOpacity
      style={styles.actualCard}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View style={styles.cardTop}>
        <View style={styles.actualIcon}>
          <Ionicons name="school-outline" size={22} color={colors.white} />
        </View>

        <View style={styles.cardTextBox}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {clase?.materia || 'Clase actual'}
          </Text>

          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {clase?.aula || 'Aula no registrada'}
          </Text>
        </View>

        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>En curso</Text>
        </View>
      </View>

      <View style={styles.cardInfoRow}>
        <InfoItem
          icon="time-outline"
          label="Horario"
          value={formatHorario(clase?.hora_inicio, clase?.hora_fin)}
        />

        <InfoItem
          icon="business-outline"
          label="Edificio"
          value={clase?.edificio?.nombre || 'No registrado'}
        />
      </View>

      <View style={styles.actionBar}>
        <Text style={styles.actionText}>Ver aula, ruta y reporte</Text>
        <Ionicons name="chevron-forward" size={17} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

function ProximaClaseCard({ clase, onPress }) {
  return (
    <TouchableOpacity
      style={styles.normalCard}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View style={styles.cardTop}>
        <View style={styles.softIcon}>
          <Ionicons name="calendar-outline" size={21} color={colors.primary} />
        </View>

        <View style={styles.cardTextBox}>
          <Text style={styles.normalTitle} numberOfLines={1}>
            {clase?.materia || 'Próxima clase'}
          </Text>

          <Text style={styles.normalSubtitle} numberOfLines={1}>
            {clase?.aula || 'Aula no registrada'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>

      <View style={styles.cardInfoRow}>
        <InfoItem
          icon="time-outline"
          label="Horario"
          value={formatHorario(clase?.hora_inicio, clase?.hora_fin)}
        />

        <InfoItem
          icon="person-outline"
          label="Docente"
          value={clase?.docente || 'No registrado'}
        />
      </View>
    </TouchableOpacity>
  );
}

function BibliotecaCard({ espacio, onPress }) {
  const nombre = espacio?.name || espacio?.nombre || 'Biblioteca';

  const puestosLibres =
    espacio?.freeSeats ??
    espacio?.availableSeats ??
    espacio?.puestos_libres ??
    espacio?.free_seats ??
    null;

  const ocupacion =
    espacio?.occupancyPercent ??
    espacio?.occupancy ??
    espacio?.ocupacion ??
    null;

  const estado =
    espacio?.status || espacio?.estado || espacio?.estado_actual || 'Disponible';

  return (
    <TouchableOpacity
      style={styles.libraryCard}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View style={styles.cardTop}>
        <View style={styles.libraryIcon}>
          <Ionicons name="library-outline" size={22} color={colors.primary} />
        </View>

        <View style={styles.cardTextBox}>
          <Text style={styles.normalTitle} numberOfLines={1}>
            {nombre}
          </Text>

          <Text style={styles.normalSubtitle} numberOfLines={1}>
            {estado}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>

      <View style={styles.libraryInfoRow}>
        <View style={styles.libraryMetric}>
          <Text style={styles.metricValue}>
            {puestosLibres !== null ? puestosLibres : '—'}
          </Text>
          <Text style={styles.metricLabel}>puestos libres</Text>
        </View>

        <View style={styles.libraryMetric}>
          <Text style={styles.metricValue}>
            {ocupacion !== null ? `${ocupacion}%` : '—'}
          </Text>
          <Text style={styles.metricLabel}>ocupación</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />

      <View style={styles.infoTextBox}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function EmptyCard({ icon, title, text }) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={23} color={colors.textMuted} />
      </View>

      <View style={styles.emptyTextBox}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyText}>{text}</Text>
      </View>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.loadingCard}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Cargando tu información...</Text>
    </View>
  );
}

function ErrorState({ mensaje, onRetry }) {
  return (
    <View style={styles.errorCard}>
      <Ionicons name="alert-circle-outline" size={34} color="#DC2626" />

      <Text style={styles.errorTitle}>No se pudo cargar</Text>
      <Text style={styles.errorText}>{mensaje}</Text>

      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatearFechaCorta() {
  const fecha = new Date();

  return fecha
    .toLocaleDateString('es-EC', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
    .replace('.', '');
}

function formatHorario(inicio, fin) {
  if (!inicio || !fin) return 'Sin horario';

  const opciones = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  return `${formatearHora(inicio, opciones)} – ${formatearHora(fin, opciones)}`;
}

function formatearHora(valor, opciones) {
  if (!valor) return '--:--';

  if (String(valor).includes('T')) {
    const fecha = new Date(valor);

    if (!Number.isNaN(fecha.getTime())) {
      return fecha.toLocaleTimeString([], opciones);
    }
  }

  return String(valor).slice(0, 5);
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

  headerCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  headerTextBox: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  headerKicker: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  headerTitle: {
    fontSize: typography.size.lg,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  headerSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 19,
  },

  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },

  dateChipText: {
    marginLeft: 5,
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    textTransform: 'capitalize',
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },

  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  sectionTextBox: {
    flex: 1,
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

  actualCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  normalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  libraryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  actualIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  softIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  libraryIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  cardTextBox: {
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
    fontWeight: typography.weight.semibold,
  },

  normalTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  normalSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 3,
    fontWeight: typography.weight.semibold,
  },

  activeBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  activeBadgeText: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: typography.weight.bold,
  },

  cardInfoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  infoItem: {
    flex: 1,
    minHeight: 45,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoTextBox: {
    flex: 1,
    marginLeft: spacing.xs,
  },

  infoLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  infoValue: {
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    fontWeight: typography.weight.semibold,
    marginTop: 2,
  },

  actionBar: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionText: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    marginRight: 4,
  },

  libraryInfoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  libraryMetric: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  metricValue: {
    fontSize: typography.size.lg,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  metricLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginTop: 2,
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  emptyTextBox: {
    flex: 1,
  },

  emptyTitle: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  emptyText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },

  loadingCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },

  errorCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },

  errorTitle: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    marginTop: spacing.sm,
  },

  errorText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.xs,
  },

  retryBtn: {
    marginTop: spacing.md,
    minHeight: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  retryText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
});