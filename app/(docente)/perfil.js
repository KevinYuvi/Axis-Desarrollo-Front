import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../src/shared/theme/colors';
import { typography } from '../../src/shared/theme/typography';
import { spacing, radius } from '../../src/shared/theme/spacing';

export default function DocentePerfilRoute() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useAuth();

  const nombre = user?.fullName || 'Docente';
  const email = user?.primaryEmailAddress?.emailAddress || 'Sin correo';

  const rol =
    user?.publicMetadata?.rol?.toString?.().toLowerCase?.() || 'docente';

  const cerrarSesion = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión.');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(docente)')}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.avatar}>
          <Ionicons name="person" size={42} color={colors.primary} />
        </View>

        <Text style={styles.nombre}>{nombre}</Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.rolBadge}>
          <Text style={styles.rolText}>{rol.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
          <View>
            <Text style={styles.label}>Correo institucional</Text>
            <Text style={styles.value}>{email}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons
            name="school-outline"
            size={20}
            color={colors.textSecondary}
          />
          <View>
            <Text style={styles.label}>Rol</Text>
            <Text style={styles.value}>Docente</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={cerrarSesion}>
        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },

  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },

  backBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  nombre: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  email: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },

  rolBadge: {
    marginTop: spacing.sm,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },

  rolText: {
    fontSize: 12,
    fontWeight: typography.weight.bold,
    color: '#16A34A',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  label: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },

  value: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },

  logoutBtn: {
    backgroundColor: colors.danger || '#EF4444',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
});