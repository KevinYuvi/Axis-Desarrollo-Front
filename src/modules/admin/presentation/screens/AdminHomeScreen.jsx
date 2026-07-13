import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader } from '../../../../shared/components';

import { obtenerResumenAdmin } from '../../services/adminApi';

const CLERK_JWT_TEMPLATE = 'Axis';

export default function AdminHomeScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState({
    totalAulas: 0,
    aulasDisponibles: 0,
    aulasOcupadas: 0,
    totalReservas: 0,
    totalReportes: 0,
    reportesAbiertos: 0,
    reportesEnProceso: 0,
    reportesResueltos: 0,
  });

  const [error, setError] = useState('');

  const cargarResumen = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      setError('');

      const token = await getToken({
        template: CLERK_JWT_TEMPLATE,
      });

      const data = await obtenerResumenAdmin(token);

      setResumen(data.resumen);
    } catch (err) {
      console.error('Error cargando resumen admin:', err);
      setError(err.message || 'No se pudo cargar el resumen.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarResumen({ silencioso: true });
    }, [])
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader
        rol="admin"
        onNotifPress={() => cargarResumen({ silencioso: false })}
        onProfilePress={() => router.push('/(admin)/perfil')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Panel administrativo</Text>
            <Text style={styles.subtitle}>Resumen general del sistema Axis.</Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => cargarResumen({ silencioso: false })}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando información...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.grid}>
              <SummaryCard
                icon="business-outline"
                label="Total de aulas"
                value={resumen.totalAulas}
              />

              <SummaryCard
                icon="checkmark-circle-outline"
                label="Disponibles"
                value={resumen.aulasDisponibles}
              />

              <SummaryCard
                icon="calendar-outline"
                label="Reservas"
                value={resumen.totalReservas}
              />

              <SummaryCard
                icon="alert-circle-outline"
                label="Reportes abiertos"
                value={resumen.reportesAbiertos}
                danger
              />
            </View>

            <View style={styles.statusCard}>
              <Text style={styles.cardTitle}>Estado de reportes</Text>

              <View style={styles.statusRow}>
                <StatusItem
                  label="Abiertos"
                  value={resumen.reportesAbiertos}
                  color="#DC2626"
                  bg="#FEF2F2"
                />

                <StatusItem
                  label="En proceso"
                  value={resumen.reportesEnProceso}
                  color={colors.primary}
                  bg="#EFF6FF"
                />

                <StatusItem
                  label="Resueltos"
                  value={resumen.reportesResueltos}
                  color="#16A34A"
                  bg="#DCFCE7"
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Accesos rápidos</Text>

              <QuickAction
                icon="business-outline"
                title="Gestionar aulas"
                subtitle="Ver espacios, capacidad y estado."
                onPress={() => router.push('/(admin)/aulas')}
              />

              <QuickAction
                icon="calendar-outline"
                title="Controlar reservas"
                subtitle="Revisar reservas activas y futuras."
                onPress={() => router.push('/(admin)/reservas')}
              />

              <QuickAction
                icon="document-text-outline"
                title="Ver reportes"
                subtitle="Gestionar incidencias registradas."
                onPress={() => router.push('/(admin)/reportes')}
                noBorder
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ icon, label, value, danger }) {
  return (
    <View style={styles.summaryCard}>
      <View
        style={[
          styles.summaryIcon,
          danger && {
            backgroundColor: '#FEF2F2',
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={danger ? '#DC2626' : colors.primary}
        />
      </View>

      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function StatusItem({ label, value, color, bg }) {
  return (
    <View style={[styles.statusItem, { backgroundColor: bg }]}>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
      <Text style={[styles.statusLabel, { color }]}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, title, subtitle, onPress, noBorder }) {
  return (
    <TouchableOpacity
      style={[styles.quickAction, noBorder && styles.noBorder]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>

      <View style={styles.quickTextBox}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
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

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },

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

  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },

  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  errorText: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: '#DC2626',
    textAlign: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  summaryCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  summaryValue: {
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  summaryLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginTop: 2,
  },

  statusCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  statusItem: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },

  statusValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },

  statusLabel: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
    marginTop: 2,
    textAlign: 'center',
  },

  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  noBorder: {
    borderBottomWidth: 0,
  },

  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  quickTextBox: {
    flex: 1,
  },

  quickTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  quickSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});