import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader } from '../../../../shared/components';

import DetalleAulaScreen from './DetalleAulaScreen';
import ReportarIncidenciaScreen from './ReportarIncidenciaScreen';
import ReportesScreen from './ReportesScreen';
import ReservarAulaScreen from './ReservarAulaScreen';
import AsistenteIAScreen from './AsistenteIAScreen';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const CLERK_JWT_TEMPLATE = 'Axis';

const ESTADO_CONFIG = {
  activa: {
    bg: '#F0FDF4',
    text: '#16A34A',
    label: 'Activa',
    icon: 'checkmark-circle-outline',
  },
  pendiente: {
    bg: '#FFF7ED',
    text: '#D97706',
    label: 'Pendiente',
    icon: 'time-outline',
  },
  cancelada: {
    bg: '#FEF2F2',
    text: '#DC2626',
    label: 'Cancelada',
    icon: 'close-circle-outline',
  },
};

export default function DocenteHomeScreen({ onNavigate, token }) {
  const { getToken, signOut } = useAuth();

  const [pantallaActual, setPantallaActual] = useState('home');
  const [clasesHoy, setClasesHoy] = useState([]);
  const [claseActual, setClaseActual] = useState(null);
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  const [proximasClases, setProximasClases] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    cargarCronograma();
  }, []);

  const cargarCronograma = async () => {
    try {
      setLoading(true);

      if (!API_URL) {
        throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
      }

      const tokenActualizado = await obtenerTokenValido();

      console.log('API_URL DOCENTE:', API_URL);
      console.log('TOKEN DOCENTE INICIO:', tokenActualizado?.substring(0, 40));

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
        const errorClaseActual = await responseClaseActual.text();

        console.log('STATUS MI CLASE ACTUAL:', responseClaseActual.status);
        console.log('ERROR MI CLASE ACTUAL:', errorClaseActual);

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
        const errorText = await responseClasesHoy.text();

        console.log('STATUS MIS CLASES HOY:', responseClasesHoy.status);
        console.log('ERROR MIS CLASES HOY:', errorText);

        if (responseClasesHoy.status === 401) {
          throw new Error('Tu sesión no es válida o el token fue rechazado.');
        }

        if (responseClasesHoy.status === 403) {
          throw new Error(
            'Tu usuario no tiene rol de docente o admin en Clerk.'
          );
        }

        throw new Error(
          `Error al obtener el cronograma de hoy. Status: ${responseClasesHoy.status}`
        );
      }

      const data = await responseClasesHoy.json();

      const clases = Array.isArray(data) ? data : [];

      setClasesHoy(clases);

      if (claseActivaDesdeBackend?.reserva?.id) {
        setProximasClases(
          clases.filter(
            (item) => item.reserva?.id !== claseActivaDesdeBackend.reserva.id
          )
        );
      } else {
        setProximasClases(clases);
      }
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

  const cerrarSesion = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión.');
    }
  };

  const formatHorario = (isoInicio, isoFin) => {
    if (!isoInicio || !isoFin) return 'N/A';

    const opts = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    return `${new Date(isoInicio).toLocaleTimeString([], opts)} – ${new Date(
      isoFin
    ).toLocaleTimeString([], opts)}`;
  };

  const getEstadoClase = (item) => {
    const inicioMs = new Date(item.reserva?.hora_inicio).getTime();
    const finMs = new Date(item.reserva?.hora_fin).getTime();
    const ahoraMs = Date.now();

    if (ahoraMs >= inicioMs && ahoraMs <= finMs) return ESTADO_CONFIG.activa;
    if (ahoraMs < inicioMs) return ESTADO_CONFIG.pendiente;
    return ESTADO_CONFIG.cancelada;
  };

  const formatFecha = (isoStr) => {
    if (!isoStr) return '';

    return new Date(isoStr).toLocaleDateString('es-EC', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
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
          cargarCronograma();
        }}
        onReportar={() => setPantallaActual('reporte')}
        onVerReportes={() => setPantallaActual('reportes')}
      />
    );
  }

  if (pantallaActual === 'reporte') {
    return (
      <ReportarIncidenciaScreen
        token={token}
        claseActual={claseActual}
        onBack={() => setPantallaActual('detalle')}
      />
    );
  }

  if (pantallaActual === 'reportes') {
    return (
      <ReportesScreen
        token={token}
        onBack={() => setPantallaActual('home')}
      />
    );
  }

  if (pantallaActual === 'reservar') {
    return (
      <ReservarAulaScreen
        token={token}
        onBack={() => {
          setPantallaActual('home');
          cargarCronograma();
        }}
      />
    );
  }

  if (pantallaActual === 'ia') {
    return (
      <AsistenteIAScreen
        token={token}
        onBack={() => setPantallaActual('home')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader
        rol="docente"
        onNotifPress={cargarCronograma}
        onProfilePress={onNavigate ? () => onNavigate('profile') : undefined}
        onLogoutPress={cerrarSesion}
      />

      <View style={styles.dateStrip}>
        <Ionicons name="calendar-outline" size={16} color={colors.primary} />
        <Text style={styles.dateText}>
          {formatFecha(new Date().toISOString())}
        </Text>
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
            onPress={() => setPantallaActual('reservar')}
          >
            <Ionicons name="add" size={15} color={colors.white} />
            <Text style={styles.reserveBtnText}>Reservar</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: spacing.lg }}
          />
        ) : claseActual ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.mainCard}
            onPress={() => setPantallaActual('detalle')}
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

        <Text style={styles.sectionTitle}>Otras clases de hoy</Text>

        {loading ? (
          <ActivityIndicator size="small" color={colors.textMuted} />
        ) : proximasClases.length > 0 ? (
          proximasClases.map((item, index) => {
            const estadoCfg = getEstadoClase(item);

            return (
              <TouchableOpacity
                key={item.reserva?.id || index}
                style={[
                  styles.compactCard,
                  {
                    borderColor: estadoCfg.text,
                    borderLeftWidth: 3,
                  },
                ]}
                onPress={() => {
                  setClaseSeleccionada(item);
                  setPantallaActual('detalle');
                }}
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

                  <View
                    style={[
                      styles.compactBadge,
                      { backgroundColor: estadoCfg.bg },
                    ]}
                  >
                    <Ionicons
                      name={estadoCfg.icon}
                      size={12}
                      color={estadoCfg.text}
                    />

                    <Text
                      style={[
                        styles.compactBadgeText,
                        { color: estadoCfg.text },
                      ]}
                    >
                      {estadoCfg.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.compactMateria}>
                  {item.reserva?.materia || 'Sin materia'}
                </Text>

                <Text style={styles.compactUbicacion}>
                  📍 {item.espacio?.ubicacion || 'Ubicación'}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.emptyText}>
            No tienes más clases programadas para hoy.
          </Text>
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
    padding: spacing.sm,
    marginBottom: spacing.xs,
    paddingLeft: spacing.md,
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

  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },

  compactBadgeText: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
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
});