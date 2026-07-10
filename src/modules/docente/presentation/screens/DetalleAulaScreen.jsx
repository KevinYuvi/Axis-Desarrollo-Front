import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DetalleAulaScreen({
  token,
  claseActual,
  onBack,
  onReportar,
}) {
  const [liberando, setLiberando] = useState(false);

  const formatHorario = (isoInicio, isoFin) => {
    if (!isoInicio || !isoFin) return 'N/A';
    const opciones = { hour: '2-digit', minute: '2-digit', hour12: false };
    return `${new Date(isoInicio).toLocaleTimeString([], opciones)} – ${new Date(isoFin).toLocaleTimeString([], opciones)}`;
  };

  const liberarAula = async () => {
    if (!claseActual?.espacio?.id) {
      Alert.alert('Sin aula activa', 'No hay un aula activa para liberar.');
      return;
    }

    Alert.alert(
      'Liberar aula',
      '¿Seguro que deseas liberar esta aula?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Liberar', style: 'destructive', onPress: confirmarLiberarAula },
      ]
    );
  };

  const confirmarLiberarAula = async () => {
    try {
      setLiberando(true);
      const formData = new FormData();
      formData.append('texto_chat', 'Libera mi aula');

      const response = await fetch(`${API_URL}/api/v1/ia/procesar-solicitud`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data?.detail || 'No se pudo liberar el aula.');
      if (data?.status !== 'success') throw new Error(data?.respuesta_app || 'No se pudo liberar el aula desde el asistente.');

      Alert.alert('Aula liberada', data?.respuesta_app || 'El aula fue liberada correctamente.');
      onBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo liberar el aula.');
    } finally {
      setLiberando(false);
    }
  };

  const estadoAula = claseActual?.espacio?.estado_actual === 'disponible' ? 'Disponible' : 'En curso';
  const colorEstado = estadoAula === 'Disponible' ? '#10B981' : '#D97706';
  const bgEstado = estadoAula === 'Disponible' ? '#D1FAE5' : '#FEF3C7';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Aula Asignada</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderText}>
              <Text style={styles.aulaTitle}>{claseActual?.espacio?.nombre || 'Aula asignada'}</Text>
              <Text style={styles.aulaSub}>📍 {claseActual?.espacio?.ubicacion || 'Ubicación no registrada'}</Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: bgEstado }]}>
              <Text style={[styles.statusText, { color: colorEstado }]}>{estadoAula}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Materia</Text>
            <Text style={styles.infoValue}>{claseActual?.reserva?.materia || 'Sin materia'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Horario</Text>
            <Text style={styles.infoValue}>
              {formatHorario(claseActual?.reserva?.hora_inicio, claseActual?.reserva?.hora_fin)}
            </Text>
          </View>

          <View style={styles.infoRowNoBorder}>
            <Text style={styles.infoLabel}>Estado físico</Text>
            <Text style={styles.infoValue}>{claseActual?.espacio?.estado_actual || 'ocupado'}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.releaseBtn, liberando && styles.disabledBtn]} onPress={liberarAula} disabled={liberando}>
          {liberando ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Text style={styles.releaseBtnText}>Liberar aula anticipadamente</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.reportBtn} onPress={onReportar}>
          <Ionicons name="warning-outline" size={18} color="#92400E" />
          <Text style={styles.reportBtnText}>Reportar incidencia en esta aula</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.textPrimary },
  headerSpacer: { width: 32 },
  scrollContent: { flex: 1 },
  scrollInner: { padding: spacing.lg, paddingBottom: spacing.xxl },
  mainCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeaderText: { flex: 1, paddingRight: spacing.sm },
  aulaTitle: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary },
  aulaSub: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  statusText: { fontSize: 13, fontWeight: typography.weight.bold },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoRowNoBorder: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  infoLabel: { fontSize: typography.size.sm, color: colors.textSecondary },
  infoValue: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary, maxWidth: '65%', textAlign: 'right' },
  releaseBtn: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  releaseBtnText: { color: colors.textPrimary, fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  reportBtn: { flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: '#FEF3C7', borderRadius: radius.md, borderWidth: 1, borderColor: '#F59E0B', paddingVertical: spacing.md, alignItems: 'center' },
  reportBtnText: { color: '#92400E', fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  disabledBtn: { opacity: 0.6 },
});