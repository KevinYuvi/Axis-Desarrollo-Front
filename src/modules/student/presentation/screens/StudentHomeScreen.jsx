import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import Button from '../../../../shared/components/Button';
import { summaryMock, recommendedSpaceMock } from '../../../../shared/mocks/spacesMock';

export default function StudentHomeScreen() {
  const handleRecommendation = () => Alert.alert('Aquí se mostrará la recomendación inteligente de Axis');
  const handleAllLibraries = () => Alert.alert('Pantalla: Ver todas las bibliotecas');

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../../../../assets/axis_la_central_conectada_icon.png')} 
              style={styles.headerLogo} 
              resizeMode="contain" 
            />
            <Text style={styles.brandText}>AXIS</Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Estudiante</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="bell" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="user" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Titles */}
        <Text style={styles.title}>Encuentra dónde estudiar</Text>
        <Text style={styles.subtitle}>Espacios disponibles en el campus UCE</Text>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Buscar biblioteca, sala o computadora..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

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

      {/* Bottom Tab Bar Mock */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="home" size={24} color={colors.primary} />
          <Text style={styles.tabLabelActive}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="book" size={24} color={colors.textSecondary} />
          <Text style={styles.tabLabel}>Bibliotecas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <MaterialCommunityIcons name="robot-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.tabLabel}>Asistente</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  brandText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  chip: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  searchIcon: {
    marginRight: spacing.sm,
    color: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
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
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingBottom: 24,
  },
  tabItem: {
    alignItems: 'center',
  },
  tabIconActive: {
    color: colors.primary,
  },
  tabIcon: {
    color: colors.textSecondary,
  },
  tabLabelActive: {
    fontSize: typography.size.xs,
    color: colors.primary,
    marginTop: 4,
    fontWeight: typography.weight.medium,
  },
  tabLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
