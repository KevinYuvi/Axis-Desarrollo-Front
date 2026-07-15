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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import AppHeader from '../../../../shared/components/organisms/AppHeader';
import {
  obtenerMisClasesHoy,
  obtenerProximaClase,
} from '../../services/estudianteApi';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

export default function EstudianteClasesScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [proximaClase, setProximaClase] = useState(null);
  const [clasesHoy, setClasesHoy] = useState([]);
  const [error, setError] = useState('');

  const cargarDatos = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) setLoading(true);

      setError('');

      const [proximaRes, clasesRes] = await Promise.all([
        obtenerProximaClase(),
        obtenerMisClasesHoy(),
      ]);

      setProximaClase(proximaRes?.data || null);
      setClasesHoy(Array.isArray(clasesRes?.data) ? clasesRes.data : []);
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

  const irRutaClase = (clase) => {
    if (!clase?.id) return;

    router.push(`/(estudiante)/ruta-clase/${clase.id}`);
  };

  const renderProximaClase = () => {
    if (!proximaClase) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={34} color={colors.textMuted} />

          <Text style={styles.emptyTitle}>Sin próxima clase</Text>

          <Text style={styles.emptyText}>
            No tienes clases pendientes registradas para hoy.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="school-outline" size={24} color={colors.primary} />
          </View>

          <View style={styles.heroTextBox}>
            <Text style={styles.heroLabel}>Próxima clase</Text>
            <Text style={styles.heroTitle}>{proximaClase.materia}</Text>
          </View>
        </View>

        <View style={styles.detailBox}>
          <InfoRow
            icon="time-outline"
            text={`${proximaClase.hora_inicio} - ${proximaClase.hora_fin}`}
          />

          <InfoRow icon="person-outline" text={proximaClase.docente} />

          <InfoRow
            icon="business-outline"
            text={`${proximaClase.aula} · ${proximaClase.edificio?.nombre}`}
          />

          <InfoRow
            icon="location-outline"
            text={proximaClase.edificio?.referencia || 'Sin referencia'}
          />
        </View>

        <TouchableOpacity
          style={styles.routeButton}
          onPress={() => irRutaClase(proximaClase)}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.white} />
          <Text style={styles.routeButtonText}>Cómo llegar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderClase = (clase) => {
    const estadoConfig = obtenerEstadoConfig(clase.estado);

    return (
      <View key={clase.id} style={styles.classCard}>
        <View style={styles.classHeader}>
          <View style={styles.classIcon}>
            <Ionicons name="book-outline" size={20} color={colors.primary} />
          </View>

          <View style={styles.classTitleBox}>
            <Text style={styles.classTitle}>{clase.materia}</Text>

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
            text={`${clase.aula} · ${clase.edificio?.nombre}`}
          />

          <InfoRow
            icon="layers-outline"
            text={clase.edificio?.bloque || 'Sin bloque'}
          />
        </View>

        <TouchableOpacity
          style={styles.secondaryRouteButton}
          onPress={() => irRutaClase(clase)}
          activeOpacity={0.85}
        >
          <Ionicons name="map-outline" size={16} color={colors.primary} />
          <Text style={styles.secondaryRouteButtonText}>Ver ruta</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader rol="estudiante" />

      <View style={styles.pageHeader}>
        <View style={styles.pageIcon}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        </View>

        <View style={styles.pageTextBox}>
          <Text style={styles.pageTitle}>Mis clases</Text>
          <Text style={styles.pageSubtitle}>
            Consulta tu horario y ruta al edificio.
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
            {renderProximaClase()}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Clases de hoy</Text>
              <Text style={styles.sectionCount}>{clasesHoy.length}</Text>
            </View>

            {clasesHoy.length > 0 ? (
              clasesHoy.map(renderClase)
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="calendar-clear-outline"
                  size={34}
                  color={colors.textMuted}
                />

                <Text style={styles.emptyTitle}>Sin clases hoy</Text>

                <Text style={styles.emptyText}>
                  No tienes horarios registrados para este día.
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

  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  heroTextBox: {
    flex: 1,
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

  routeButton: {
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  routeButtonText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
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
    borderRadius: 20,
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

  secondaryRouteButton: {
    minHeight: 40,
    borderRadius: radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  secondaryRouteButtonText: {
    color: colors.primary,
    fontSize: typography.size.sm,
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

  emptyTitle: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    marginTop: spacing.md,
  },

  emptyText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.xs,
  },

  loadingBox: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.size.sm,
  },
});