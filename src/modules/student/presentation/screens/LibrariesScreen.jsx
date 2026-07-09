import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader, SearchInput, SpaceListCard } from '../../../../shared/components';
import { useOccupancy } from '../../../../shared/hooks/useOccupancy';

const FILTERS = ['Todas', 'Bibliotecas', 'Salas', 'Computadoras'];

export default function LibrariesScreen({ onNavigate, onNavigateToCamera }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todas');
  const { loading, isFallback, spaces } = useOccupancy();
  const { user } = useUser();
  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'estudiante';

  const filteredLibraries = useMemo(() => {
    return spaces.filter(space => {
      const matchesSearch =
        space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.type.toLowerCase().includes(searchQuery.toLowerCase());

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
    onNavigateToCamera(space.id);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />

      {/* ── Cabecera única ── */}
      <AppHeader rol={rol} />

      <ScrollView contentContainerStyle={styles.content}>

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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
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
  },
});
