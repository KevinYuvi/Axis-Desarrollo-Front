import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader } from '../../../../shared/components';

export default function AyudanteHomeScreen({ rol }) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <AppHeader rol={rol || 'ayudante'} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Panel de Soporte Técnico</Text>
          <Text style={styles.welcomeSubtitle}>
            Herramientas para monitoreo y gestión de reportes
          </Text>
        </View>

        <View style={styles.toolsContainer}>
          <TouchableOpacity 
            style={[styles.toolCard, { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' }]}
            onPress={() => router.push('/(dashboard)/camara')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="videocam-outline" size={32} color="#2563EB" />
            </View>
            <Text style={[styles.toolTitle, { color: '#1E3A8A' }]}>Cámara y Visión</Text>
            <Text style={[styles.toolDesc, { color: '#3B82F6' }]}>
              Ver la cámara y métricas de ocupación en vivo de los laboratorios.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toolCard, { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]}
            onPress={() => router.push('/(dashboard)/reportes')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="warning-outline" size={32} color="#D97706" />
            </View>
            <Text style={[styles.toolTitle, { color: '#92400E' }]}>Gestión de Reportes</Text>
            <Text style={[styles.toolDesc, { color: '#B45309' }]}>
              Revisar incidencias reportadas por docentes.
            </Text>
          </TouchableOpacity>
        </View>
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
    padding: spacing.lg,
  },
  welcomeSection: {
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  welcomeSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  toolsContainer: {
    gap: spacing.lg,
  },
  toolCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  toolTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  toolDesc: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
});
