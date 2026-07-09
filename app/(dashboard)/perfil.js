import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { colors } from '../../src/shared/theme/colors';
import { typography } from '../../src/shared/theme/typography';
import { spacing, radius } from '../../src/shared/theme/spacing';
import { AppHeader } from '../../src/shared/components';

const ROL_LABEL = {
  estudiante: 'Estudiante',
  docente: 'Docente',
  ayudante: 'Ayudante',
  admin: 'Administrador',
};

export default function PerfilScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'estudiante';
  const nombre = user?.fullName || user?.firstName || 'Usuario';
  const email = user?.primaryEmailAddress?.emailAddress || '';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <AppHeader rol={rol} />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={colors.primary} />
          </View>
          <Text style={styles.nombre}>{nombre}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.rolBadge}>
            <Text style={styles.rolBadgeText}>{ROL_LABEL[rol] || 'Usuario'}</Text>
          </View>
        </View>

        {/* Separador */}
        <View style={styles.divider} />

        {/* Info extra */}
        <View style={styles.infoRow}>
          <Ionicons name="school-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>Universidad Central del Ecuador</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>Cuenta verificada con Clerk</Text>
        </View>

        <View style={styles.divider} />

        {/* Cerrar sesión */}
        <TouchableOpacity onPress={() => signOut()} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: spacing.sm }} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  nombre: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  email: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  rolBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  rolBadgeText: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  infoText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  logoutText: {
    color: '#fff',
    fontWeight: typography.weight.bold,
    fontSize: typography.size.md,
  },
});