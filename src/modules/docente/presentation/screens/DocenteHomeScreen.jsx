import React, { useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader } from '../../../../shared/components';

import DetalleAulaScreen from './DetalleAulaScreen';
import ReportarIncidenciaScreen from './ReportarIncidenciaScreen';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const CLERK_JWT_TEMPLATE = 'Axis';

export default function DocenteHomeScreen({ token }) {
  const router = useRouter();
  const { getToken } = useAuth();

  const [pantallaActual, setPantallaActual] = useState('home');
  const [claseActual, setClaseActual] = useState(null);
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  const [proximasClases, setProximasClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yaCargoPrimeraVez, setYaCargoPrimeraVez] = useState(false);

  const obtenerTokenValido = async () => {
    const tokenClerk = await getToken({
      template: CLERK_JWT_TEMPLATE,
    });

    if (tokenClerk) {
      return tokenClerk;
    }

    if (token) {
      return token;
    }

    throw new Error('No se pudo obtener un token válido de Clerk.');
  };

  const convertirFechaBackend = (fechaTexto) => {
    if (!fechaTexto) return null;

    const fecha = new Date(fechaTexto);

    if (Number.isNaN(fecha.getTime())) {
      return null;
    }

    return fecha;
  };

  const obtenerTiempo = (isoFecha) => {
    const fecha = convertirFechaBackend(isoFecha);

    if (!fecha) return 0;

    const tiempo = fecha.getTime();

    return Number.isNaN(tiempo) ? 0 : tiempo;
  };

const filtrarProximasClases = (clases, claseActiva) => {
  const ahoraMs = Date.now();
  const claseActivaId = claseActiva?.reserva?.id;

  return clases
    .filter((item) => {
      const reserva = item?.reserva;

      if (!reserva?.hora_inicio || !reserva?.hora_fin) {
        return false;
      }

      if (claseActivaId && reserva.id === claseActivaId) {
        return false;
      }

      if (
        reserva.liberada_anticipadamente === true ||
        reserva.estado === 'liberada' ||
        reserva.estado === 'cancelada'
      ) {
        return false;
      }

      const inicioMs = obtenerTiempo(reserva.hora_inicio);
      const finMs = obtenerTiempo(reserva.hora_fin);

      if (!inicioMs || !finMs) {
        return false;
      }

      if (finMs <= ahoraMs) {
        return false;
      }

      if (finMs <= inicioMs) {
        return false;
      }

      return inicioMs > ahoraMs;
    })
    .sort((a, b) => {
      const inicioA = obtenerTiempo(a?.reserva?.hora_inicio);
      const inicioB = obtenerTiempo(b?.reserva?.hora_inicio);

      return inicioA - inicioB;
    });
};

  const cargarCronograma = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      if (!API_URL) {
        throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
      }

      const tokenActualizado = await obtenerTokenValido();

      let claseActivaDesdeBackend = null;

      const responseClaseActual = await fetch(
        `${API_URL}/api/v1/reservas/mi-clase-actual`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokenActualizado}`,
            Accept: 'application/json',
          },
        }
      );

      if (responseClaseActual.ok) {
        const dataClaseActual = await responseClaseActual.json();

        if (dataClaseActual?.reserva) {
          claseActivaDesdeBackend = dataClaseActual;
          setClaseActual(dataClaseActual);
        } else {
          setClaseActual(null);
        }
      } else {
        setClaseActual(null);
      }

      const responseClasesHoy = await fetch(
        `${API_URL}/api/v1/reservas/mis-clases-hoy`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokenActualizado}`,
            Accept: 'application/json',
          },
        }
      );

      if (!responseClasesHoy.ok) {
        if (responseClasesHoy.status === 401) {
          throw new Error('Tu sesión no es válida o el token fue rechazado.');
        }

        if (responseClasesHoy.status === 403) {
          throw new Error('Tu usuario no tiene rol de docente o admin en Clerk.');
        }

        throw new Error(
          `Error al obtener el cronograma de hoy. Status: ${responseClasesHoy.status}`
        );
      }

      const data = await responseClasesHoy.json();
      const clases = Array.isArray(data) ? data : [];

      const siguientes = filtrarProximasClases(
        clases,
        claseActivaDesdeBackend
      );

      setProximasClases(siguientes);
      setYaCargoPrimeraVez(true);
    } catch (error) {
      console.error('Error cargando cronograma:', error);

      Alert.alert(
        'Error',
        error?.message || 'No se pudo sincronizar el itinerario de hoy.'
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setPantallaActual('home');
      setClaseSeleccionada(null);

      cargarCronograma({
        silencioso: yaCargoPrimeraVez,
      });
    }, [yaCargoPrimeraVez])
  );

  const formatHorario = (isoInicio, isoFin) => {
    if (!isoInicio || !isoFin) return 'N/A';

    const opts = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    const inicio = convertirFechaBackend(isoInicio);
    const fin = convertirFechaBackend(isoFin);

    if (!inicio || !fin) return 'N/A';

    return `${inicio.toLocaleTimeString([], opts)} – ${fin.toLocaleTimeString(
      [],
      opts
    )}`;
  };

  const formatFechaCorta = () => {
    const fecha = new Date();

    const diaSemana = fecha.toLocaleDateString('es-EC', {
      weekday: 'short',
    });

    const dia = fecha.toLocaleDateString('es-EC', {
      day: '2-digit',
    });

    const mes = fecha.toLocaleDateString('es-EC', {
      month: 'short',
    });

    const diaSemanaLimpio = diaSemana.replace('.', '');
    const mesLimpio = mes.replace('.', '');

    return `${diaSemanaLimpio} · ${dia} ${mesLimpio}`;
  };

  const abrirDetalle = (item) => {
    setClaseSeleccionada(item);
    setPantallaActual('detalle');
  };

  const renderSkeleton = () => {
    return (
      <View>
        <View style={styles.skeletonMainCard}>
          <View style={styles.skeletonHeaderRow}>
            <View style={styles.skeletonTitleBlock}>
              <View style={styles.skeletonLineLarge} />
              <View style={styles.skeletonLineSmall} />
            </View>

            <View style={styles.skeletonBadge} />
          </View>

          <View style={styles.skeletonDivider} />

          <View style={styles.skeletonInfoRow}>
            <View style={styles.skeletonInfoLabel} />
            <View style={styles.skeletonInfoValue} />
          </View>

          <View style={styles.skeletonInfoRow}>
            <View style={styles.skeletonInfoLabel} />
            <View style={styles.skeletonInfoValueShort} />
          </View>

          <View style={styles.skeletonHint} />
        </View>

        <View style={styles.skeletonSectionTitle} />

        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.skeletonCompactCard}>
            <View style={styles.skeletonCompactTop}>
              <View>
                <View style={styles.skeletonLineMedium} />
                <View style={styles.skeletonLineSmall} />
              </View>

              <View style={styles.skeletonCircle} />
            </View>

            <View style={styles.skeletonLineMediumAlt} />
            <View style={styles.skeletonLineSmallAlt} />
          </View>
        ))}
      </View>
    );
  };

  if (pantallaActual === 'detalle') {
    const claseAMostrar = claseSeleccionada || claseActual;

    return (
      <DetalleAulaScreen
        token={token}
        claseActual={claseAMostrar}
        onBack={() => {
          setPantallaActual('home');
          setClaseSeleccionada(null);
          cargarCronograma({ silencioso: true });
        }}
        onReportar={() => setPantallaActual('reporte')}
      />
    );
  }

  if (pantallaActual === 'reporte') {
    return (
      <ReportarIncidenciaScreen
        token={token}
        claseActual={claseSeleccionada || claseActual}
        onBack={() => setPantallaActual('detalle')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader
        rol="docente"
        onNotifPress={() => cargarCronograma({ silencioso: false })}
        onProfilePress={() => router.push('/(docente)/perfil')}
      />

      <View style={styles.dateContainer}>
        <View style={styles.datePill}>
          <Ionicons
            name="calendar-clear-outline"
            size={15}
            color={colors.primary}
          />

          <Text style={styles.dateLabel}>Hoy</Text>

          <View style={styles.dateDivider} />

          <Text style={styles.dateText}>{formatFechaCorta()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.mainTitle}>Mi Aula Asignada Ahora</Text>

          <TouchableOpacity
            style={styles.reserveBtn}
            onPress={() => router.push('/(docente)/reservas')}
          >
            <Ionicons name="add" size={15} color={colors.white} />
            <Text style={styles.reserveBtnText}>Reservar</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          renderSkeleton()
        ) : (
          <>
            {claseActual ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.mainCard}
                onPress={() => abrirDetalle(claseActual)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.aulaTitle}>
                      {claseActual.espacio?.nombre || 'Aula asignada'}
                    </Text>

                    <Text style={styles.aulaSub}>
                      {claseActual.espacio?.ubicacion ||
                        'Ubicación no registrada'}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>En curso</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Materia</Text>

                  <Text style={styles.infoValue}>
                    {claseActual.reserva?.materia || 'Sin materia'}
                  </Text>
                </View>

                <View style={styles.infoRowLast}>
                  <Text style={styles.infoLabel}>Horario</Text>

                  <Text style={styles.infoValue}>
                    {formatHorario(
                      claseActual.reserva?.hora_inicio,
                      claseActual.reserva?.hora_fin
                    )}
                  </Text>
                </View>

                <View style={styles.tapHint}>
                  <Text style={styles.tapHintText}>Tocar para ver opciones</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.primary}
                  />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.noClassCard}>
                <Ionicons
                  name="calendar-outline"
                  size={32}
                  color={colors.textMuted}
                />

                <Text style={styles.noClassText}>
                  No tienes un aula asignada para este horario exacto.
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Próximas clases de hoy</Text>

            {proximasClases.length > 0 ? (
              proximasClases.map((item, index) => (
                <TouchableOpacity
                  key={item.reserva?.id || index}
                  style={styles.compactCard}
                  onPress={() => abrirDetalle(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.compactCardTop}>
                    <View style={styles.compactCardLeft}>
                      <Text style={styles.compactAulaName}>
                        {item.espacio?.nombre || 'Aula'}
                      </Text>

                      <Text style={styles.compactHorario}>
                        {formatHorario(
                          item.reserva?.hora_inicio,
                          item.reserva?.hora_fin
                        )}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </View>

                  <Text style={styles.compactMateria}>
                    {item.reserva?.materia || 'Sin materia'}
                  </Text>

                  <Text style={styles.compactUbicacion}>
                    📍 {item.espacio?.ubicacion || 'Ubicación no registrada'}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No tienes más clases pendientes para hoy.
              </Text>
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

  dateContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    alignItems: 'flex-start',
  },

  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    gap: 7,
  },

  dateLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },

  dateDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
  },

  dateText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },

  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  mainTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.sm,
  },

  reserveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  reserveBtnText: {
    color: colors.white,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },

  mainCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },

  cardHeaderText: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  aulaTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  aulaSub: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  statusBadge: {
    backgroundColor: '#E8F8F5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },

  statusText: {
    color: colors.available,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  infoRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },

  infoLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },

  infoValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    maxWidth: '58%',
    textAlign: 'right',
  },

  tapHint: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },

  tapHintText: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },

  noClassCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  noClassText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },

  compactCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  compactCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },

  compactCardLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  compactAulaName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  compactHorario: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  compactMateria: {
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    fontWeight: typography.weight.semibold,
    marginBottom: 2,
  },

  compactUbicacion: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },

  skeletonMainCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },

  skeletonTitleBlock: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  skeletonLineLarge: {
    width: '76%',
    height: 22,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },

  skeletonLineMedium: {
    width: 150,
    height: 15,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },

  skeletonLineMediumAlt: {
    width: '58%',
    height: 13,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginBottom: 7,
  },

  skeletonLineSmall: {
    width: 100,
    height: 12,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonLineSmallAlt: {
    width: '42%',
    height: 12,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonBadge: {
    width: 72,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  skeletonInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },

  skeletonInfoLabel: {
    width: 80,
    height: 13,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonInfoValue: {
    width: 140,
    height: 13,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonInfoValueShort: {
    width: 95,
    height: 13,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },

  skeletonHint: {
    alignSelf: 'flex-end',
    width: 120,
    height: 13,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginTop: spacing.xs,
  },

  skeletonSectionTitle: {
    width: 150,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  skeletonCompactCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  skeletonCompactTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },

  skeletonCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
  },
});