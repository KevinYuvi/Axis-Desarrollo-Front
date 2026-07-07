import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import AppHeader from '../../../../shared/components/AppHeader';
import SearchInput from '../../../../shared/components/SearchInput';
import BottomTabBar from '../../../../shared/components/BottomTabBar';
import SpaceListCard from '../../../../shared/components/SpaceListCard';
import { useOccupancy } from '../../../../shared/hooks/useOccupancy';

const FILTERS = ['Todas', 'Bibliotecas', 'Salas', 'Computadoras'];

export default function LibrariesScreen({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todas');
  const { loading, isFallback, spaces } = useOccupancy();

  const filteredLibraries = useMemo(() => {
    return spaces.filter(space => {
      // Filter by search
      const matchesSearch = space.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            space.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by category
      let matchesFilter = true;
      if (activeFilter === 'Bibliotecas') {
        matchesFilter = space.type === 'Biblioteca';
      } else if (activeFilter === 'Salas') {
        matchesFilter = space.type === 'Sala de estudio';
      } else if (activeFilter === 'Computadoras') {
        matchesFilter = space.availableComputers > 0 || space.type === 'Laboratorio';
      }

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter, spaces]);

  const handleSpaceDetail = (space) => {
    const raw = space.raw;
    const detailLines = raw
      ? [
          `${raw.building} · ${raw.floor}`,
          `Puestos: ${raw.freeSeats} libres de ${raw.totalSeats}`,
          `Computadoras: ${raw.computersAvailable} de ${raw.computersTotal}`,
          `Salas de estudio: ${raw.studyRoomsAvailable} de ${raw.studyRoomsTotal}`,
          raw.recommendationReason,
        ]
      : [`${space.type} · ${space.distanceTime}`, `${space.occupancy}% ocupación`];

    Alert.alert(space.name, detailLines.filter(Boolean).join('\n'));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        
        <AppHeader />

        <Text style={styles.title}>Bibliotecas y salas</Text>
        <Text style={styles.subtitle}>Consulta espacios disponibles en la UCE</Text>

        {isFallback && (
          <View style={styles.fallbackNotice}>
            <Feather name="wifi-off" size={12} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.fallbackText}>Mostrando datos simulados</Text>
          </View>
        )}

        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar biblioteca, sala o computadora..."
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer} contentContainerStyle={styles.filtersContent}>
          {FILTERS.map(filter => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
          ) : filteredLibraries.length > 0 ? (
            filteredLibraries.map(space => (
              <SpaceListCard
                key={space.id}
                space={space}
                onPressDetail={handleSpaceDetail}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No se encontraron espacios.</Text>
            </View>
          )}
        </View>

      </ScrollView>

      <BottomTabBar activeTab="libraries" onTabPress={(tab) => onNavigate(tab)} />
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
  filtersContainer: {
    marginBottom: spacing.lg,
    maxHeight: 36,
  },
  filtersContent: {
    paddingRight: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.medium,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContainer: {
    marginTop: spacing.sm,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
  }
});
