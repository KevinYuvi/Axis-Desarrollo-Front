import React from 'react';
import { Feather } from '@expo/vector-icons'; // Corregido el typo aquí
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../../../../shared/hooks/useClerkOrMock';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { Button, AppHeader, SearchInput } from '../../../../shared/components';
import { useOccupancy } from '../../../../shared/hooks/useOccupancy';

export default function StudentHomeScreen({ onNavigate, onNavigateToCamera }) {
  const { user } = useUser();
  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'estudiante';
  const { loading, summary, recommendation } = useOccupancy();

  const handleRecommendation = () => {
    if (!recommendation) {
      Alert.alert('Axis', 'Todavía no hay una recomendación disponible.');
      return;
    }
    onNavigateToCamera(recommendation.space.id);
  };

  const handleAllLibraries = () => onNavigate('libraries');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />

      {/* ── Cabecera única (no hay header nativo de Expo Router) ── */}
      <AppHeader rol={rol} />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Títulos */}
        <Text style={styles.title}>Encuentra dónde estudiar</Text>
        <Text style={styles.subtitle}>Espacios disponibles en el campus UCE</Text>

        <SearchInput placeholder="Buscar biblioteca, sala o computadora..." />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : (
          <>
            {/* Tarjetas de resumen con fallback a 0 por seguridad */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryNumber, { color: colors.available }]}>
                  {summary?.tables ?? 0}
                </Text>
                <Text style={styles.summaryLabel}>Mesas libres</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryNumber, { color: colors.primary }]}>
                  {summary?.computers ?? 0}
                </Text>
                <Text style={styles.summaryLabel}>Computadoras</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryNumber, { color: colors.available }]}>
                  {summary?.rooms ?? 0}
                </Text>
                <Text style={styles.summaryLabel}>Salas</Text>
              </View>
            </View>

            {/* Tarjeta recomendada */}
            {recommendation && (
              <View style={styles.recommendedCard}>
                <View style={styles.recommendedBadge}>
                  <Feather name="star" size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
                  <Text style={styles.recommendedBadgeText}>Recomendado por AXIS</Text>
                </View>
                <Text style={styles.recommendedTitle}>{recommendation.space.name}</Text>
                <Text style={styles.recommendedDesc}>
                  {recommendation.space.occupancyPercent ?? recommendation.space.occupancy}% ocupación ·{' '}
                  {recommendation.space.freeSeats ?? recommendation.space.availableTables} puestos libres ·{' '}
                  A {recommendation.space.distanceMinutes
                    ? `${recommendation.space.distanceMinutes} min`
                    : recommendation.space.distanceTime}
                </Text>
                <Button title="Ver recomendación" onPress={handleRecommendation} />
              </View>
            )}
          </>
        )}

        {/* Botón secundario */}
        <TouchableOpacity style={styles.secondaryButton} onPress={handleAllLibraries}>
          <Text style={styles.secondaryButtonText}>Ver todas las bibliotecas →</Text>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
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
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginHorizontal: 4,
    backgroundColor: colors.white,
  },
  summaryNumber: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  summaryLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  recommendedCard: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recommendedBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: '#8B5CF6',
  },
  recommendedTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  recommendedDesc: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
});