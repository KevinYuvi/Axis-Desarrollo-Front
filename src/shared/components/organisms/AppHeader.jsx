import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

// Mapeo de roles a etiquetas en español y colores distintivos
const ROL_CONFIG = {
  estudiante: { label: 'Estudiante', bg: '#EFF6FF', text: '#2563EB' },
  docente:    { label: 'Docente',    bg: '#F0FDF4', text: '#16A34A' },
  ayudante:   { label: 'Ayudante',  bg: '#FFF7ED', text: '#D97706' },
  admin:      { label: 'Admin',     bg: '#FDF4FF', text: '#9333EA' },
};

/**
 * AppHeader — Cabecera única de la aplicación.
 * Props:
 *   rol         {string}   — rol del usuario (estudiante | docente | ayudante | admin)
 *   onNotifPress{function} — acción al pulsar la campanita (opcional)
 *   onUserPress {function} — acción al pulsar el avatar (opcional)
 */
export default function AppHeader({ rol = 'estudiante', onNotifPress, onUserPress }) {
  const normalizedRol = (rol || 'estudiante').toLowerCase();
  const config = ROL_CONFIG[normalizedRol] || ROL_CONFIG.estudiante;

  return (
    <View style={styles.header}>
      {/* ── Logo + Brand ── */}
      <View style={styles.headerLeft}>
        <Image
          source={require('../../../../assets/axis_la_central_conectada_icon.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.brandText}>AXIS</Text>
        {/* Chip de rol dinámico */}
        <View style={[styles.chip, { backgroundColor: config.bg }]}>
          <Text style={[styles.chipText, { color: config.text }]}>{config.label}</Text>
        </View>
      </View>

      {/* ── Acciones del header ── */}
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotifPress}
          accessibilityLabel="Notificaciones"
        >
          <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onUserPress}
          accessibilityLabel="Mi perfil"
        >
          <Ionicons name="person-circle-outline" size={24} color={colors.textSecondary} />
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
    // Línea sutil en la parte baja
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
    gap: 2,
  },
  iconButton: {
    padding: spacing.xs,
    marginLeft: 2,
  },
});

