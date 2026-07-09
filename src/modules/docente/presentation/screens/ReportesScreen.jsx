import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ESTADO_COLORS = {
  abierto:    { bg: '#FEF3C7', text: '#D97706' },
  en_proceso: { bg: '#EFF6FF', text: colors.primary },
  resuelto:   { bg: '#F0FDF4', text: '#16A34A' },
};

export default function ReportesScreen({ token, onBack }) {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/reportes/mis-reportes`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data?.detail || 'No se pudieron cargar los reportes.');

      setReportes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleString([], {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Cabecera con botón de regreso */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Volver">
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes realizados</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={cargarReportes} accessibilityLabel="Actualizar">
          <Ionicons name="refresh-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : reportes.length > 0 ? (
          reportes.map((item, index) => {
            const estadoConfig = ESTADO_COLORS[item.estado] || ESTADO_COLORS.abierto;
            return (
              <View key={item.id || index} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportCodigo}>{item.codigo || `TK-${String(index + 1).padStart(3, '0')}`}</Text>
                    <Text style={styles.reportDate}>{formatearFecha(item.fecha_reporte)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: estadoConfig.bg }]}>
                    <Text style={[styles.statusText, { color: estadoConfig.text }]}>
                      {(item.estado || 'abierto').replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.reportDescription}>{item.descripcion || 'Sin descripción registrada.'}</Text>

                <View style={styles.reportFooter}>
                  <Text style={styles.footerText}>Gravedad: <Text style={styles.footerValue}>{item.gravedad || 'No definida'}</Text></Text>
                  <Text style={styles.footerText}>Espacio: <Text style={styles.footerValue}>{item.espacio_nombre || item.espacio_id || '—'}</Text></Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="document-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>Todavía no hay reportes registrados.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  iconBtn: {
    padding: spacing.xs,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollInner: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  reportCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  reportCodigo: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  reportDate: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
    textTransform: 'capitalize',
  },
  reportDescription: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  reportFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: 2,
  },
  footerText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
  },
  footerValue: {
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});