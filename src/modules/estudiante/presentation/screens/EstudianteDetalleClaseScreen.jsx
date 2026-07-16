import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

import AppHeader from '../../../../shared/components/organisms/AppHeader';
import { obtenerDetalleClase } from '../../services/estudianteApi';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const CLERK_JWT_TEMPLATE = 'Axis';

export default function EstudianteDetalleClaseScreen() {
  const router = useRouter();
  const { claseId } = useLocalSearchParams();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [clase, setClase] = useState(null);
  const [error, setError] = useState('');

  const obtenerTokenAxis = async () => {
    const token = await getToken({ template: CLERK_JWT_TEMPLATE, skipCache: true });
    if (!token) throw new Error('No se pudo obtener una sesión activa.');
    return token;
  };

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await obtenerTokenAxis();
      const response = await obtenerDetalleClase({ token, claseId });
      setClase(response?.data || null);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el detalle de la clase.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarDetalle();
    }, [claseId])
  );

  const irRuta = () => {
    if (!clase?.id) return;
    router.push(`/(estudiante)/ruta-clase/${clase.id}`);
  };

  const irReporte = () => {
    router.push('/(estudiante)/reportar-actual');
  };

  const estadoConfig = obtenerEstadoConfig(clase?.estado);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <AppHeader rol="estudiante" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={21} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Detalle de clase</Text>
          <Text style={styles.headerSubtitle}>Aula, ruta y reporte de inconvenientes</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando detalle...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={36} color="#DC2626" />
            <Text style={styles.emptyTitle}>No se pudo cargar</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : !clase ? (
          <View style={styles.emptyCard}>
            <Ionicons name="search-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Clase no encontrada</Text>
            <Text style={styles.emptyText}>Esta clase no está dentro de tu horario de hoy.</Text>
          </View>
        ) : (
          <>
            <View style={styles.mainCard}>
              <View style={styles.topRow}>
                <View style={styles.iconBox}>
                  <Ionicons name="school-outline" size={26} color={colors.primary} />
                </View>
                <View style={styles.titleBox}>
                  <Text style={styles.label}>Materia</Text>
                  <Text style={styles.title}>{clase.materia}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: estadoConfig.bg }]}> 
                  <Text style={[styles.statusText, { color: estadoConfig.color }]}>{estadoConfig.label}</Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <InfoRow icon="business-outline" label="Aula" value={clase.aula} />
                <InfoRow icon="location-outline" label="Edificio" value={clase.edificio?.nombre} />
                <InfoRow icon="layers-outline" label="Bloque" value={clase.edificio?.bloque || 'Sin bloque'} />
                <InfoRow icon="time-outline" label="Horario" value={`${clase.hora_inicio} - ${clase.hora_fin}`} />
                <InfoRow icon="person-outline" label="Docente" value={clase.docente} />
                <InfoRow icon="map-outline" label="Referencia" value={clase.edificio?.referencia || 'Sin referencia'} />
              </View>
            </View>

            <View style={styles.actionsCard}>
              <TouchableOpacity style={styles.primaryBtn} onPress={irRuta} activeOpacity={0.85}>
                <Ionicons name="navigate-outline" size={18} color={colors.white} />
                <Text style={styles.primaryBtnText}>Ver ruta al aula</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reportBtn, clase.estado !== 'actual' && styles.disabledBtn]}
                onPress={irReporte}
                activeOpacity={0.85}
                disabled={clase.estado !== 'actual'}
              >
                <Ionicons name="warning-outline" size={18} color={clase.estado === 'actual' ? '#92400E' : colors.textMuted} />
                <View style={styles.reportTextBox}>
                  <Text style={[styles.reportTitle, clase.estado !== 'actual' && styles.disabledText]}>Reportar inconveniente</Text>
                  <Text style={[styles.reportSub, clase.estado !== 'actual' && styles.disabledText]}>
                    {clase.estado === 'actual' ? 'Disponible solo durante esta clase.' : 'Solo se habilita cuando la clase está en curso.'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoTextBox}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'No registrado'}</Text>
      </View>
    </View>
  );
}

function obtenerEstadoConfig(estado) {
  if (estado === 'actual') return { label: 'Actual', bg: '#DCFCE7', color: '#16A34A' };
  if (estado === 'finalizada') return { label: 'Finalizada', bg: '#F1F5F9', color: '#64748B' };
  return { label: 'Próxima', bg: '#EFF6FF', color: colors.primary };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  headerTextBox: { flex: 1 },
  headerTitle: { fontSize: typography.size.md, color: colors.textPrimary, fontWeight: typography.weight.bold },
  headerSubtitle: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 1 },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  mainCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  iconBox: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  titleBox: { flex: 1 },
  label: { fontSize: 11, color: colors.primary, textTransform: 'uppercase', fontWeight: typography.weight.bold, letterSpacing: 0.7 },
  title: { fontSize: typography.size.lg, color: colors.textPrimary, fontWeight: typography.weight.bold, marginTop: 2 },
  statusBadge: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: typography.weight.bold },
  infoBox: { backgroundColor: '#F8FAFC', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  infoIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  infoTextBox: { flex: 1 },
  infoLabel: { fontSize: 11, color: colors.textMuted, fontWeight: typography.weight.bold, textTransform: 'uppercase' },
  infoValue: { fontSize: typography.size.sm, color: colors.textPrimary, fontWeight: typography.weight.semibold, marginTop: 2 },
  actionsCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  primaryBtn: { minHeight: 48, borderRadius: radius.md, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText: { color: colors.white, fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  reportBtn: { minHeight: 56, borderRadius: radius.md, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#F59E0B', flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  reportTextBox: { flex: 1 },
  reportTitle: { fontSize: typography.size.sm, color: '#92400E', fontWeight: typography.weight.bold },
  reportSub: { fontSize: 11, color: '#92400E', marginTop: 2 },
  disabledBtn: { backgroundColor: '#F8FAFC', borderColor: colors.border },
  disabledText: { color: colors.textMuted },
  emptyCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: 'center' },
  emptyTitle: { fontSize: typography.size.md, color: colors.textPrimary, fontWeight: typography.weight.bold, marginTop: spacing.sm },
  emptyText: { fontSize: typography.size.sm, color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  loadingCard: { minHeight: 280, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.sm, fontSize: typography.size.sm, color: colors.textSecondary },
});
