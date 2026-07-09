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

const ACCIONES_ADMIN = [
  { id: 'espacios', icon: 'business-outline', label: 'Gestionar Espacios', desc: 'Aulas, laboratorios y salas' },
  { id: 'usuarios', icon: 'people-outline', label: 'Gestionar Usuarios', desc: 'Roles y permisos' },
  { id: 'reportes', icon: 'warning-outline', label: 'Ver Incidencias', desc: 'Revisar reportes del campus' },
  { id: 'reservas', icon: 'calendar-outline', label: 'Ver Reservas', desc: 'Control de reservas activas' },
];

export default function AdminScreen() {
  const { user } = useUser();
  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'admin';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <AppHeader rol={rol} />

      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.title}>Panel de Administración</Text>
        <Text style={styles.subtitle}>Control total de aulas, bloqueos e incidencias.</Text>

        <View style={styles.grid}>
          {ACCIONES_ADMIN.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={28} color={colors.primary} />
              </View>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },
});