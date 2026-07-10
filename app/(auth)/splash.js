import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../src/shared/theme/colors';
import { typography } from '../../src/shared/theme/typography';
import { spacing, radius } from '../../src/shared/theme/spacing';

export default function SplashScreen() {
  const router = useRouter();

  const handleRoleSelection = (rol) => {
    // Redirigir al login pasando el rol como query param
    router.push(`/(auth)/login?rol=${rol}`);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="school" size={42} color={colors.white} />
          </View>
          <Text style={styles.title}>Bienvenido a Axis</Text>
          <Text style={styles.subtitle}>Selecciona cómo quieres ingresar al sistema</Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity 
            style={[styles.card, { borderColor: '#3B82F6' }]} 
            onPress={() => handleRoleSelection('estudiante')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="person-outline" size={32} color="#2563EB" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Soy Estudiante</Text>
              <Text style={styles.cardSub}>Buscar espacios, ver bibliotecas y usar IA</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, { borderColor: '#10B981' }]} 
            onPress={() => handleRoleSelection('docente')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="book-outline" size={32} color="#16A34A" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Soy Docente</Text>
              <Text style={styles.cardSub}>Gestionar mi aula, reservas y reportar incidencias</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, { borderColor: '#F59E0B' }]} 
            onPress={() => handleRoleSelection('ayudante')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="build-outline" size={32} color="#D97706" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Soy Ayudante</Text>
              <Text style={styles.cardSub}>Atender incidencias y dar soporte técnico</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
