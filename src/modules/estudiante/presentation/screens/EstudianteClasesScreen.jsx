import React, { useCallback, useMemo, useState } from 'react';
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
import {
  obtenerMisClasesHoy,
  obtenerProximaClase,
} from '../../services/estudianteApi';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const CLERK_JWT_TEMPLATE = 'Axis';

export default function EstudianteClasesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [proximaClase, setProximaClase] = useState(null);
  const [clasesHoy, setClasesHoy] = useState([]);
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
      if (!silencioso) setLoading(true);

      setError('');

      const token = await obtenerTokenAxis();

      const [proximaRes, clasesRes] = await Promise.all([
        obtenerProximaClase({ token }),
        obtenerMisClasesHoy({ token }),
      ]);

      const clases = Array.isArray(clasesRes?.data) ? clasesRes.data : [];

      setProximaClase(proximaRes?.data || null);
      setClasesHoy(clases);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar las clases.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  const refrescar = () => {
    setRefreshing(true);
    cargarDatos({ silencioso: true });
  };

  const clasePrincipal = useMemo(() => {
    const claseActual = clasesHoy.find((item) => item.estado === 'actual');

    if (claseActual) {
      return claseActual;
    }

    if (proximaClase && proximaClase.estado !== 'finalizada') {
      return proximaClase;
    }

    return clasesHoy.find((item) => item.estado === 'proxima') || null;
  }, [clasesHoy, proximaClase]);

  const clasesPendientes = useMemo(() => {
    return clasesHoy
      .filter((clase) => {
        if (!clase) return false;

        if (clase.estado === 'finalizada') {
          return false;
        }

        if (clasePrincipal?.id && clase.id === clasePrincipal.id) {
          return false;
        }

        return clase.estado === 'actual' || clase.estado === 'proxima';
      })
      .sort((a, b) => convertirHoraAMinutos(a.hora_inicio) - convertirHoraAMinutos(b.hora_inicio));
  }, [clasesHoy, clasePrincipal]);

  const totalVigentes = clasePrincipal ? clasesPendientes.length + 1 : clasesPendientes.length;

  const irDetalleClase = (clase) => {
    if (!clase?.id) return;

    router.push(`/(estudiante)/clase/${clase.id}`);
  };

  const renderClasePrincipal = () => {
    if (!clasePrincipal) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={34} color={colors.textMuted} />

          <Text style={styles.emptyTitle}>Sin clases pendientes</Text>

          <Text style={styles.emptyText}>
            No tienes clases activas o próximas para hoy.
          </Text>
        </View>
      );
    }

    const esActual = clasePrincipal.estado === 'actual';

    return (
      <TouchableOpacity
        style={[styles.heroCard, esActual && styles.heroCardActual]}
        onPress={() => irDetalleClase(clasePrincipal)}
        activeOpacity={0.88}
      >
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, esActual && styles.heroIconActual]}>
            <Ionicons
              name={esActual ? 'radio-button-on-outline' : 'school-outline'}
              size={24}
              color={esActual ? colors.white : colors.primary}
            />
          </View>

          <View style={styles.heroTextBox}>
            <View style={styles.heroLabelRow}>
              <View
                style={[
                  styles.statusDot,
                  esActual ? styles.statusDotActual : styles.statusDotProxima,
                ]}
              />

              <Text style={styles.heroLabel}>
                {esActual ? 'Clase actual' : 'Próxima clase'}
              </Text>
            </View>

            <Text style={styles.heroTitle} numberOfLines={2}>
              {clasePrincipal.materia}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={21} color={colors.textMuted} />
        </View>

        <View style={styles.detailBox}>
          <InfoRow
            icon="time-outline"
            text={`${clasePrincipal.hora_inicio} - ${clasePrincipal.hora_fin}`}
          />

          <InfoRow
            icon="person-outline"
            text={clasePrincipal.docente || 'Docente no registrado'}
          />

          <InfoRow
            icon="business-outline"
            text={`${clasePrincipal.aula || 'Aula no registrada'} · ${
              clasePrincipal.edificio?.nombre || 'Edificio no registrado'
            }`}
          />

          <InfoRow
            icon="location-outline"
            text={clasePrincipal.edificio?.referencia || 'Sin referencia'}
          />
        </View>

        <View style={styles.openDetailBtn}>
          <Ionicons
            name={esActual ? 'warning-outline' : 'map-outline'}
            size={17}
            color={colors.primary}
          />

          <Text style={styles.openDetailText}>
            {esActual
              ? 'Ver aula, ruta y reportar'
              : 'Ver detalle del aula y ruta'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderClase = (clase) => {
    const estadoConfig = obtenerEstadoConfig(clase.estado);

    return (
      <TouchableOpacity
        key={clase.id}
        style={styles.classCard}
        onPress={() => irDetalleClase(clase)}
        activeOpacity={0.88}
      >
        <View style={styles.classHeader}>
          <View style={styles.classIcon}>
            <Ionicons name="book-outline" size={20} color={colors.primary} />
          </View>

          <View style={styles.classTitleBox}>
            <Text style={styles.classTitle} numberOfLines={1}>
              {clase.materia}
            </Text>

            <Text style={styles.classSubtitle}>
              {clase.hora_inicio} - {clase.hora_fin}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: estadoConfig.bg }]}>
            <Text style={[styles.statusText, { color: estadoConfig.color }]}>
              {estadoConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.classInfo}>
          <InfoRow
            icon="business-outline"
            text={`${clase.aula || 'Aula no registrada'} · ${
              clase.edificio?.nombre || 'Edificio'
            }`}
          />

          <InfoRow
            icon="layers-outline"
            text={formatearBloque(clase.edificio?.bloque)}
          />
        </View>

        <View style={styles.classActionsRow}>
          <View style={styles.actionPill}>
            <Ionicons name="map-outline" size={16} color={colors.primary} />
            <Text style={styles.actionPillText}>Ruta</Text>
          </View>

          <View style={styles.actionPill}>
            <Ionicons name="eye-outline" size={16} color={colors.primary} />
            <Text style={styles.actionPillText}>Detalle</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
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
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        </View>

        <View style={styles.pageTextBox}>
          <Text style={styles.pageTitle}>Mis clases</Text>
          <Text style={styles.pageSubtitle}>
            Aula, ruta y reportes de tu horario.
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
            <Text style={styles.loadingText}>Cargando clases...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={34} color="#DC2626" />

            <Text style={styles.emptyTitle}>No se pudo cargar</Text>

            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionIntro}>
              <View>
                <Text style={styles.sectionTitle}>Ahora</Text>
                <Text style={styles.sectionSubtitle}>
                  Clase activa o siguiente clase pendiente.
                </Text>
              </View>

              <View style={styles.countPill}>
                <Text style={styles.countPillText}>
                  {totalVigentes} pendiente{totalVigentes === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            {renderClasePrincipal()}

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Cronograma pendiente</Text>
                <Text style={styles.sectionSubtitle}>
                  Solo se muestran clases que aún no han pasado.
                </Text>
              </View>

              <Text style={styles.sectionCount}>{clasesPendientes.length}</Text>
            </View>

            {clasesPendientes.length > 0 ? (
              clasesPendientes.map(renderClase)
            ) : (
              <View style={styles.emptyCardSmall}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={28}
                  color={colors.textMuted}
                />

                <Text style={styles.emptyTitleSmall}>
                  No hay más clases pendientes
                </Text>

                <Text style={styles.emptyText}>
                  Las clases finalizadas no se muestran en este listado.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, text }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={colors.textSecondary} />

      <Text style={styles.infoText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

function obtenerEstadoConfig(estado) {
  if (estado === 'actual') {
    return {
      label: 'Actual',
      bg: '#DCFCE7',
      color: '#16A34A',
    };
  }

  if (estado === 'finalizada') {
    return {
      label: 'Finalizada',
      bg: '#F1F5F9',
      color: '#64748B',
    };
  }

  return {
    label: 'Próxima',
    bg: '#EFF6FF',
    color: colors.primary,
  };
}

function convertirHoraAMinutos(horaTexto) {
  if (!horaTexto) return 99999;

  const partes = String(horaTexto).split(':');
  const hora = Number(partes[0] || 0);
  const minuto = Number(partes[1] || 0);

  if (Number.isNaN(hora) || Number.isNaN(minuto)) {
    return 99999;
  }

  return hora * 60 + minuto;
}

function formatearBloque(valor) {
  if (!valor) return 'Sin bloque';

  return String(valor)
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
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

  sectionIntro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  sectionSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 250,
  },

  countPill: {
    borderRadius: radius.full,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  countPillText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },

  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  heroCardActual: {
    borderColor: '#22C55E',
    borderWidth: 1.5,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  heroIconActual: {
    backgroundColor: '#16A34A',
  },

  heroTextBox: {
    flex: 1,
  },

  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusDotActual: {
    backgroundColor: '#16A34A',
  },

  statusDotProxima: {
    backgroundColor: colors.primary,
  },

  heroLabel: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  heroTitle: {
    fontSize: typography.size.lg,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    marginTop: 2,
  },

  detailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },

  infoText: {
    flex: 1,
    marginLeft: 7,
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    lineHeight: 17,
    fontWeight: typography.weight.semibold,
  },

  openDetailBtn: {
    minHeight: 42,
    borderRadius: radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  openDetailText: {
    color: colors.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },

  sectionCount: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },

  classCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  classIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  classTitleBox: {
    flex: 1,
  },

  classTitle: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  classSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
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

  classInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },

  classActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  actionPill: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  actionPillText: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },

  emptyCardSmall: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    marginTop: spacing.sm,
  },

  emptyTitleSmall: {
    fontSize: typography.size.sm,
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