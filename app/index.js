import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../src/shared/theme/colors';
import { typography } from '../src/shared/theme/typography';
import { spacing, radius } from '../src/shared/theme/spacing';

export default function StartPage() {
  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Ionicons name="pulse-outline" size={42} color={colors.primary} />
      </View>

      <Text style={styles.appName}>AXIS</Text>

      <Text style={styles.subtitle}>Tu campus en tiempo real</Text>

      <ActivityIndicator
        size="small"
        color={colors.primary}
        style={styles.loader}
      />

      <Text style={styles.loadingText}>Preparando tu sesión...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  appName: {
    fontSize: 34,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    letterSpacing: 1.5,
  },

  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: typography.weight.semibold,
  },

  loader: {
    marginTop: spacing.xl,
  },

  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.semibold,
  },
});