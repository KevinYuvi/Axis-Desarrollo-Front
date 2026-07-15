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

import AppHeader from '../../../../shared/components/organisms/AppHeader';
import {
  obtenerMisClasesHoy,
  obtenerProximaClase,
} from '../../services/estudianteApi';
import { getOccupancySpaces } from '../../../../shared/services/occupancyApi';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

export default function EstudianteHomeScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clasesHoy, setClasesHoy] = useState([]);
  const [clasePrincipal, setClasePrincipal] = useState(null);
  const [mejorEspacio, setMejorEspacio] = useState(null);
  const [resumenEstudio, setResumenEstudio] = useState({
    espacios: 0,
    puestosLibres: 0,
    computadoras: 0,
  });
  const [error, setError] = useState('');

  const fechaTexto = useMemo(() => {
    const fecha = new Date();

    return fecha.toLocaleDateString('es-EC', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, []);

  const cargarDatos = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) setLoading(true);

      setError('');

      const [clasesRes, proximaRes, ocupacionRes] = await Promise.all([
        obtenerMisClasesHoy(),
        obtenerProximaClase(),
        getOccupancySpaces(),
      ]);

      const clases = Array.isArray(clasesRes?.data) ? clasesRes.data : [];
      const claseActual = clases.find((item) => item.estado === 'actual');

      setClasesHoy(clases);
      setClasePrincipal(claseActual || proximaRes?.data || null);

      const espacios = Array.isArray(ocupacionRes?.data) ? ocupacionRes.data : [];

      const espaciosConDatos = espacios.filter(
        (item) =>
          item.occupancyPercent !== null &&
          item.occupancyPercent !== undefined
      );

      const candidatos = espaciosConDatos.filter(
        (item) => item.status !== 'Ocupado' && item.status !== 'Sin datos'
      );

      candidatos.sort((a, b) => {
        if (a.occupancyPercent !== b.occupancyPercent) {
          return a.occupancyPercent - b.occupancyPercent;
        }

        return (a.distanceMinutes || 999) - (b.distanceMinutes || 999);
      });

      setMejorEspacio(candidatos[0] || null);

      setResumenEstudio({
        espacios: espaciosConDatos.length,
        puestosLibres: espaciosConDatos.reduce(
          (sum, item) => sum + (item.freeSeats || 0),
          0
        ),
        computadoras: espaciosConDatos.reduce(
          (sum, item) => sum + (item.computersAvailable || 0),
          0
        ),
      });
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el inicio.');
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

  const irRutaClase = () => {
    if (!clasePrincipal?.id) return;

    router.push(`/(estudiante)/ruta-clase/${clasePrincipal.id}`);
  };

  const irBibliotecas = () => {
    router.push('/(estudiante)/bibliotecas');
  };

  const renderEstadoDia = () => {
    const totalClases = clasesHoy.length;
    const clasesPendientes = clasesHoy.filter(
      (item) => item.estado === 'actual' || item.estado === 'proxima'
    ).length;

    return (
      <View style={styles.todayCard}>
        <View>
          <Text style={styles.todayLabel}>Hoy</Text>
          <Text style={styles.todayDate}>{capitalizar(fechaTexto)}</Text>
        </View>
        
        <View style={styles.todayLine} />

        <Text style={styles.todayMessage}>
          {totalClases > 0
            ? `Tienes ${totalClases} ${totalClases === 1 ? 'clase registrada' : 'clases registradas'} para hoy.`
            : 'No tienes clases registradas para hoy.'}
        </Text>
      </View>
    );
  };

  const renderClasePrincipal = () => {
    if (!clasePrincipal) {
      return (
        <View style={styles.classHeroEmpty}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="calendar-clear-outline" size={26} color={colors.primary} />
          </View>

          <Text style={styles.emptyMainTitle}>Sin clase próxima</Text>

          <Text style={styles.emptyMainText}>
            Cuando tengas una clase registrada, aquí aparecerá el aula, edificio y la ruta.
          </Text>
        </View>
      );
    }

    const esActual = clasePrincipal.estado === 'actual';

    return (
      <View style={styles.classHero}>
        <View style={styles.classHeroTop}>
          <View style={styles.liveBox}>
            <View style={[styles.liveDot, esActual ? styles.liveDotActive : styles.liveDotNext]} />
            <Text style={styles.liveText}>
              {esActual ? 'Clase en curso' : 'Tu próxima clase'}
            </Text>
          </View>

          <Text style={styles.classTime}>
            {clasePrincipal.hora_inicio} - {clasePrincipal.hora_fin}
          </Text>
        </View>

        <Text style={styles.classTitle}>{clasePrincipal.materia}</Text>

        <View style={styles.locationPanel}>
          <View style={styles.locationIcon}>
            <Ionicons name="business-outline" size={21} color={colors.primary} />
          </View>

          <View style={styles.locationTextBox}>
            <Text style={styles.locationBuilding}>
              {clasePrincipal.edificio?.nombre}
            </Text>

            <Text style={styles.locationRoom}>
              {clasePrincipal.aula} · {clasePrincipal.edificio?.bloque}
            </Text>

            <Text style={styles.locationReference} numberOfLines={2}>
              {clasePrincipal.edificio?.referencia || 'Sin referencia registrada'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.routeButton}
          onPress={irRutaClase}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate-outline" size={18} color={colors.white} />
          <Text style={styles.routeButtonText}>Ver ruta al edificio</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMejorEspacio = () => {
    if (!mejorEspacio) {
      return (
        <View style={styles.studyCard}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Dónde estudiar</Text>
            <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
          </View>

          <View style={styles.noStudyBox}>
            <Text style={styles.noStudyTitle}>Sin recomendación disponible</Text>
            <Text style={styles.noStudyText}>
              Aún no hay datos suficientes de ocupación para sugerir un espacio.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.studyCard}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Dónde estudiar ahora</Text>
          <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
        </View>

        <TouchableOpacity
          style={styles.studyRecommendation}
          onPress={irBibliotecas}
          activeOpacity={0.9}
        >
          <View style={styles.studyTop}>
            <View style={styles.studyIcon}>
              <Ionicons name="library-outline" size={22} color={colors.primary} />
            </View>

            <View style={styles.studyNameBox}>
              <Text style={styles.studyName}>{mejorEspacio.name}</Text>
              <Text style={styles.studyReason}>
                Menor ocupación disponible para estudiar.
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
          </View>

          <View style={styles.studyStats}>
            <MiniStat
              label="Ocupación"
              value={`${mejorEspacio.occupancyPercent}%`}
            />

            <MiniStat
              label="Puestos"
              value={mejorEspacio.freeSeats}
            />

            <MiniStat
              label="Computadoras"
              value={mejorEspacio.computersAvailable}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderResumenCampus = () => {
    return (
      <View style={styles.summaryRow}>
        <SummaryPill
          icon="book-outline"
          value={clasesHoy.length}
          label="Clases hoy"
        />

        <SummaryPill
          icon="reader-outline"
          value={resumenEstudio.puestosLibres}
          label="Puestos libres"
        />

        <SummaryPill
          icon="desktop-outline"
          value={resumenEstudio.computadoras}
          label="PC libres"
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader rol="estudiante" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refrescar} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Preparando tu día...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={34} color="#DC2626" />
            <Text style={styles.errorTitle}>No se pudo cargar</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {renderEstadoDia()}
            {renderClasePrincipal()}
            {renderMejorEspacio()}
            {renderResumenCampus()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ label, value }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function SummaryPill({ icon, value, label }) {
  return (
    <View style={styles.summaryPill}>
      <Ionicons name={icon} size={17} color={colors.primary} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
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

  todayCard: {
    backgroundColor: colors.primary,
    borderRadius: 26,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },

  todayLabel: {
    fontSize: 12,
    color: '#DBEAFE',
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  todayDate: {
    fontSize: 24,
    color: colors.white,
    fontWeight: typography.weight.bold,
    marginTop: 4,
  },

  todayBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },

  todayBadgeNumber: {
    fontSize: 18,
    color: colors.white,
    fontWeight: typography.weight.bold,
  },

  todayBadgeText: {
    fontSize: 10,
    color: '#DBEAFE',
    fontWeight: typography.weight.semibold,
  },

  todayLine: {
    width: 46,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 999,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  todayMessage: {
    fontSize: typography.size.sm,
    color: '#EFF6FF',
    lineHeight: 20,
    maxWidth: '85%',
  },

  classHero: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  classHeroEmpty: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  emptyIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  emptyMainTitle: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  emptyMainText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.xs,
  },

  classHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  liveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  liveDotActive: {
    backgroundColor: '#16A34A',
  },

  liveDotNext: {
    backgroundColor: colors.primary,
  },

  liveText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },

  classTime: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },

  classTitle: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.md,
  },

  locationPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    marginBottom: spacing.md,
  },

  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  locationTextBox: {
    flex: 1,
  },

  locationBuilding: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  locationRoom: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    marginTop: 3,
  },

  locationReference: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },

  routeButton: {
    minHeight: 48,
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

  studyCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  sectionHead: {
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

  studyRecommendation: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  studyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  studyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  studyNameBox: {
    flex: 1,
  },

  studyName: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  studyReason: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  studyStats: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },

  miniStat: {
    flex: 1,
    alignItems: 'center',
  },

  miniValue: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  miniLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginTop: 2,
  },

  noStudyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  noStudyTitle: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  noStudyText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  summaryPill: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  summaryValue: {
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    marginTop: 5,
  },

  summaryLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginTop: 2,
    textAlign: 'center',
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
});