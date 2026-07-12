import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing } from '../../../../shared/theme/spacing';
import { AppHeader } from '../../../../shared/components';

export default function AdminReportesScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <AppHeader rol="admin" />

      <View style={styles.content}>
        <Text style={styles.title}>Reportes</Text>
        <Text style={styles.subtitle}>Gestión de incidencias registradas.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
});