import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import Button from '../../../../shared/components/Button';
import AppHeader from '../../../../shared/components/AppHeader';
import SearchInput from '../../../../shared/components/SearchInput';
import BottomTabBar from '../../../../shared/components/BottomTabBar';
import { summaryMock, recommendedSpaceMock } from '../../../../shared/mocks/spacesMock';

export default function StudentHomeScreen({ onNavigate }) {
  const handleRecommendation = () => Alert.alert('Aquí se mostrará la recomendación inteligente de Axis');
  const handleAllLibraries = () => onNavigate('libraries');

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        
        <AppHeader />

        {/* Titles */}
        <Text style={styles.title}>Encuentra dónde estudiar</Text>
        <Text style={styles.subtitle}>Espacios disponibles en el campus UCE</Text>

        <SearchInput placeholder="Buscar biblioteca, sala o computadora..." />

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color: colors.available }]}>{summaryMock.tables}</Text>
            <Text style={styles.summaryLabel}>Mesas libres</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color: colors.primary }]}>{summaryMock.computers}</Text>
            <Text style={styles.summaryLabel}>Computadoras</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color: colors.available }]}>{summaryMock.rooms}</Text>
            <Text style={styles.summaryLabel}>Salas</Text>
          </View>
        </View>

        {/* Recommended Card */}
        <View style={styles.recommendedCard}>
          <View style={styles.recommendedBadge}>
            <Feather name="star" size={14} color="#8B5CF6" style={{ marginRight: 6 }} />
            <Text style={styles.recommendedBadgeText}>Recomendado por AXIS</Text>
          </View>
          <Text style={styles.recommendedTitle}>{recommendedSpaceMock.name}</Text>
          <Text style={styles.recommendedDesc}>
            {recommendedSpaceMock.occupancy}% ocupación · {recommendedSpaceMock.availableTables} mesas libres · A {recommendedSpaceMock.distanceTime}
          </Text>
          <Button title="Ver recomendación" onPress={handleRecommendation} />
        </View>

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
