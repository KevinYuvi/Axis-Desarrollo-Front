import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import Button from '../../../../shared/components/Button';
import AppHeader from '../../../../shared/components/AppHeader';
import SearchInput from '../../../../shared/components/SearchInput';
import BottomTabBar from '../../../../shared/components/BottomTabBar';
import { useOccupancy } from '../../../../shared/hooks/useOccupancy';

export default function StudentHomeScreen({ onNavigate }) {
  const { loading, isFallback, summary, recommendation } = useOccupancy();

  const handleRecommendation = () => {
    if (!recommendation) {
      Alert.alert('Axis', 'Todavía no hay una recomendación disponible.');
      return;
    }
    Alert.alert(`Recomendado por Axis: ${recommendation.space.name}`, recommendation.reason);
  };
  const handleAllLibraries = () => onNavigate('libraries');

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>

        <AppHeader />

        {/* Titles */}
        <Text style={styles.title}>Encuentra dónde estudiar</Text>
        <Text style={styles.subtitle}>Espacios disponibles en el campus UCE</Text>

        {isFallback && (
          <View style={styles.fallbackNotice}>
            <Feather name="wifi-off" size={12} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.fallbackText}>Mostrando datos simulados</Text>
          </View>
        )}

        <SearchInput placeholder="Buscar biblioteca, sala o computadora..." />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryNumber, { color: colors.available }]}>{summary.tables}</Text>
                <Text style={styles.summaryLabel}>Mesas libres</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryNumber, { color: colors.primary }]}>{summary.computers}</Text>
                <Text style={styles.summaryLabel}>Computadoras</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryNumber, { color: colors.available }]}>{summary.rooms}</Text>
                <Text style={styles.summaryLabel}>Salas</Text>
              </View>
            </View>

            {/* Recommended Card */}
            {recommendation && (
              <View style={styles.recommendedCard}>
                <View style={styles.recommendedBadge}>
                  <Feather name="star" size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
                  <Text style={styles.recommendedBadgeText}>Recomendado por AXIS</Text>
                </View>
                <Text style={styles.recommendedTitle}>{recommendation.space.name}</Text>
                <Text style={styles.recommendedDesc}>
                  {recommendation.space.occupancyPercent ?? recommendation.space.occupancy}% ocupación · {recommendation.space.freeSeats ?? recommendation.space.availableTables} puestos libres · A {recommendation.space.distanceMinutes ? `${recommendation.space.distanceMinutes} min` : recommendation.space.distanceTime}
                </Text>
                <Button title="Ver recomendación" onPress={handleRecommendation} />
              </View>
            )}
          </>
        )}

        {/* Secondary Button */}
        <TouchableOpacity style={styles.secondaryButton} onPress={handleAllLibraries}>
          <Text style={styles.secondaryButtonText}>Ver todas las bibliotecas →</Text>
        </TouchableOpacity>

      </ScrollView>

      <BottomTabBar activeTab="home" onTabPress={(tab) => onNavigate(tab)} />
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
    paddingBottom: 100,
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
  fallbackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  fallbackText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
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
  },
  secondaryButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },
});
