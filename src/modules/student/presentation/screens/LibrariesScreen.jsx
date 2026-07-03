import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import AppHeader from '../../../../shared/components/AppHeader';
import SearchInput from '../../../../shared/components/SearchInput';
import BottomTabBar from '../../../../shared/components/BottomTabBar';
import SpaceListCard from '../../../../shared/components/SpaceListCard';
import { librariesMock } from '../../../../shared/mocks/spacesMock';

const FILTERS = ['Todas', 'Bibliotecas', 'Salas', 'Computadoras'];

export default function LibrariesScreen({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todas');

  const filteredLibraries = useMemo(() => {
    return librariesMock.filter(space => {
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
  }, [searchQuery, activeFilter]);

  const handleSpaceDetail = (space) => {
    Alert.alert('Aquí se mostrará el detalle del espacio seleccionado');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        
        <AppHeader />

        <Text style={styles.title}>Bibliotecas y salas</Text>
        <Text style={styles.subtitle}>Consulta espacios disponibles en la UCE</Text>

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
          {filteredLibraries.length > 0 ? (
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
