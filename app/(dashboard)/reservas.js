import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { colors } from '../../src/shared/theme/colors';
import { typography } from '../../src/shared/theme/typography';
import { spacing, radius } from '../../src/shared/theme/spacing';
import { AppHeader } from '../../src/shared/components';

const RESERVAS_MOCK = [
  {
    id: 'rv-001',
    espacio: 'Biblioteca Central',
    fecha: '2026-07-09',
    hora: '08:00 – 10:00',
    estado: 'activa',
  },
  {
    id: 'rv-002',
    espacio: 'Sala de Cómputo 3',
    fecha: '2026-07-10',
    hora: '14:00 – 16:00',
    estado: 'pendiente',
  },
];

const ESTADO_CONFIG = {
  activa:    { bg: '#F0FDF4', text: '#16A34A', label: 'Activa' },
  pendiente: { bg: '#FFF7ED', text: '#D97706', label: 'Pendiente' },
  cancelada: { bg: '#FEF2F2', text: colors.danger,  label: 'Cancelada' },
};

export default function ReservasScreen() {
  const { user } = useUser();
  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'estudiante';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <AppHeader rol={rol} />

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Mis Reservas</Text>
          <TouchableOpacity style={styles.newBtn}>
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.newBtnText}>Nueva</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Historial de espacios académicos reservados.</Text>

        {RESERVAS_MOCK.map((reserva) => {
          const config = ESTADO_CONFIG[reserva.estado] || ESTADO_CONFIG.pendiente;
          return (
            <View key={reserva.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEspacio}>{reserva.espacio}</Text>
                <View style={[styles.badge, { backgroundColor: config.bg }]}>
                  <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
                </View>
              </View>
              <View style={styles.cardRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.cardMeta}> {reserva.fecha}</Text>
              </View>
              <View style={styles.cardRow}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.cardMeta}> {reserva.hora}</Text>
              </View>
            </View>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  newBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 4,
  },
  newBtnText: {
    color: colors.white,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardEspacio: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardMeta: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },
});