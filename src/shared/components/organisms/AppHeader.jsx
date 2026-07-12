import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

const ROL_CONFIG = {
  estudiante: {
    label: 'Estudiante',
    bg: '#EFF6FF',
    text: '#2563EB',
    perfilRoute: '/(estudiante)/perfil',
  },
  docente: {
    label: 'Docente',
    bg: '#F0FDF4',
    text: '#16A34A',
    perfilRoute: '/(docente)/perfil',
  },
  ayudante: {
    label: 'Ayudante',
    bg: '#FFF7ED',
    text: '#D97706',
    perfilRoute: '/(ayudante)/perfil',
  },
  admin: {
    label: 'Admin',
    bg: '#FDF4FF',
    text: '#9333EA',
    perfilRoute: '/(admin)/perfil',
  },
};

export default function AppHeader({
  rol = 'estudiante',
  onNotifPress,
  onProfilePress,
  onUserPress,
}) {
  const router = useRouter();

  const normalizedRol = String(rol || 'estudiante').toLowerCase();
  const config = ROL_CONFIG[normalizedRol] || ROL_CONFIG.estudiante;

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
      return;
    }

    if (onUserPress) {
      onUserPress();
      return;
    }

    router.push(config.perfilRoute);
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image
          source={require('../../../../assets/axis_la_central_conectada_icon.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />

        <Text style={styles.brandText}>AXIS</Text>

        <View style={[styles.chip, { backgroundColor: config.bg }]}>
          <Text style={[styles.chipText, { color: config.text }]}>
            {config.label}
          </Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotifPress}
          accessibilityLabel="Notificaciones"
        >
          <Ionicons
            name="notifications-outline"
            size={23}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleProfilePress}
          accessibilityLabel="Mi perfil"
        >
          <Ionicons
            name="person-circle-outline"
            size={26}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },

  headerLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    marginRight: 2,
  },

  brandText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    letterSpacing: 1.5,
    marginRight: spacing.xs,
  },

  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },

  chipText: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  iconButton: {
    padding: spacing.xs,
    marginLeft: 2,
  },
});