import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AppHeader from '../../../../shared/components/organisms/AppHeader';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

export default function EstudianteHomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader rol="estudiante" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="school-outline" size={24} color={colors.primary} />
          </View>

          <Text style={styles.heroTitle}>Hola, estudiante</Text>

          <Text style={styles.heroText}>
            Encuentra espacios disponibles para estudiar, revisa bibliotecas y
            usa el asistente de Axis para orientarte en el campus.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Accesos principales</Text>

        <View style={styles.grid}>
          <HomeAction
            title="Bibliotecas"
            subtitle="Ver disponibilidad"
            icon="library-outline"
            onPress={() => router.push('/(estudiante)/bibliotecas')}
          />

          <HomeAction
            title="Asistente IA"
            subtitle="Preguntar a Axis"
            icon="sparkles-outline"
            onPress={() => router.push('/(estudiante)/asistente')}
          />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />
          </View>

          <View style={styles.infoTextBox}>
            <Text style={styles.infoTitle}>Modo estudiante</Text>
            <Text style={styles.infoText}>
              Este perfil está pensado para consultar espacios de estudio y
              recibir orientación. No permite reservar aulas ni gestionar
              reportes.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeAction({ title, subtitle, icon, onPress }) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>

      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },

  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  heroTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  heroText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  actionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  actionSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 3,
  },

  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  infoTextBox: {
    flex: 1,
  },

  infoTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  infoText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 3,
  },
});