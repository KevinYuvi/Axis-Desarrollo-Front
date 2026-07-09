import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader } from '../../../../shared/components';

import DetalleAulaScreen from './DetalleAulaScreen';
import ReportarIncidenciaScreen from './ReportarIncidenciaScreen';
import ReportesScreen from './ReportesScreen';
import ReservarAulaScreen from './ReservarAulaScreen';
import AsistenteIAScreen from './AsistenteIAScreen';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DocenteHomeScreen({ onNavigate, token }) {
  const [pantallaActual, setPantallaActual] = useState('home');
  const [clasesHoy, setClasesHoy] = useState([]);
  const [claseActual, setClaseActual] = useState(null);
  const [proximasClases, setProximasClases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCronograma();
  }, []);

  const cargarCronograma = async () => {
    try {
      setLoading(true);
      let claseActivaDesdeBackend = null;

      const responseClaseActual = await fetch(`${API_URL}/api/v1/reservas/mi-clase-actual`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (responseClaseActual.ok) {
        claseActivaDesdeBackend = await responseClaseActual.json();
        setClaseActual(claseActivaDesdeBackend);
      } else {
        setClaseActual(null);
      }

      const responseClasesHoy = await fetch(`${API_URL}/api/v1/reservas/mis-clases-hoy`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (!responseClasesHoy.ok) throw new Error('Error al obtener el cronograma de hoy.');

      const data = await responseClasesHoy.json();
      setClasesHoy(data);

      if (claseActivaDesdeBackend?.reserva?.id) {
        setProximasClases(data.filter((item) => item.reserva?.id !== claseActivaDesdeBackend.reserva.id));
      } else {
        setProximasClases(data);
      }
    } catch (error) {
      console.error('Error cargando cronograma:', error);
      Alert.alert('Error', 'No se pudo sincronizar el itinerario de hoy.');
    } finally {
      setLoading(false);
    }
  };

  const formatHorario = (isoInicio, isoFin) => {
    if (!isoInicio || !isoFin) return 'N/A';
    const opts = { hour: '2-digit', minute: '2-digit', hour12: false };
    return `${new Date(isoInicio).toLocaleTimeString([], opts)} – ${new Date(isoFin).toLocaleTimeString([], opts)}`;
  };

  // ── Sub-pantallas (internamente): siguen usando el token recibido ──
  if (pantallaActual === 'detalle') {
    return (
      <DetalleAulaScreen
        token={token}
        claseActual={claseActual}
        onBack={() => { setPantallaActual('home'); cargarCronograma(); }}
        onReportar={() => setPantallaActual('reporte')}
        onVerReportes={() => setPantallaActual('reportes')}
      />
    );
  }
  if (pantallaActual === 'reporte') {
    return <ReportarIncidenciaScreen token={token} claseActual={claseActual} onBack={() => setPantallaActual('detalle')} />;
  }
  if (pantallaActual === 'reportes') {
    return <ReportesScreen token={token} onBack={() => setPantallaActual('home')} />;
  }
  if (pantallaActual === 'reservar') {
    return <ReservarAulaScreen token={token} onBack={() => { setPantallaActual('home'); cargarCronograma(); }} />;
  }
  if (pantallaActual === 'ia') {
    return <AsistenteIAScreen token={token} onBack={() => setPantallaActual('home')} />;
  }

  // ── Home principal del docente ──
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Cabecera unificada AXIS */}
      <AppHeader
        rol="docente"
        onNotifPress={cargarCronograma}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>

        {/* Título + botón reservar */}
        <View style={styles.titleRow}>
          <Text style={styles.mainTitle}>Mi Aula Asignada Ahora</Text>
          <TouchableOpacity style={styles.reserveBtn} onPress={() => setPantallaActual('reservar')}>
            <Ionicons name="add" size={15} color={colors.white} />
            <Text style={styles.reserveBtnText}>Reservar</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta de clase activa */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.lg }} />
        ) : claseActual ? (
          <TouchableOpacity activeOpacity={0.85} style={styles.mainCard} onPress={() => setPantallaActual('detalle')}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <Text style={styles.aulaTitle}>{claseActual.espacio?.nombre || 'Aula asignada'}</Text>
                <Text style={styles.aulaSub}>{claseActual.espacio?.ubicacion || 'Ubicación no registrada'}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>En curso</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Materia</Text>
              <Text style={styles.infoValue}>{claseActual.reserva?.materia || 'Sin materia'}</Text>
            </View>
            <View style={styles.infoRowLast}>
              <Text style={styles.infoLabel}>Horario</Text>
              <Text style={styles.infoValue}>{formatHorario(claseActual.reserva?.hora_inicio, claseActual.reserva?.hora_fin)}</Text>
            </View>

            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Tocar para ver opciones</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.noClassCard}>
            <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
            <Text style={styles.noClassText}>No tienes un aula asignada para este horario exacto.</Text>
          </View>
        )}

        {/* Otras clases del día */}
        <Text style={styles.sectionTitle}>Otras clases de hoy</Text>

        {loading ? (
          <ActivityIndicator size="small" color={colors.textMuted} />
        ) : proximasClases.length > 0 ? (
          proximasClases.map((item, index) => (
            <View key={item.reserva?.id || index} style={styles.secondaryCard}>
              <View style={styles.secondaryCardHeader}>
                <Ionicons name="business-outline" size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
                <Text style={styles.secondaryAulaTitle}>{item.espacio?.nombre || 'Aula'}</Text>
                <Text style={styles.secondaryTime}>{formatHorario(item.reserva?.hora_inicio, item.reserva?.hora_fin)}</Text>
              </View>
              <Text style={styles.secondaryMateria}>{item.reserva?.materia || 'Sin materia'}</Text>
              <Text style={styles.secondaryUbicacion}>📍 {item.espacio?.ubicacion || 'Ubicación no registrada'}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No tienes más clases programadas para hoy.</Text>
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
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mainTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  reserveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reserveBtnText: {
    color: colors.white,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  mainCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardHeaderText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  aulaTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  aulaSub: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#E8F8F5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  statusText: {
    color: colors.available,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    maxWidth: '58%',
    textAlign: 'right',
  },
  tapHint: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  tapHintText: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
  noClassCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  noClassText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  secondaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  secondaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  secondaryAulaTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  secondaryTime: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
  secondaryMateria: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.semibold,
    marginLeft: 26,
  },
  secondaryUbicacion: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
    marginLeft: 26,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});