import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '../../src/shared/hooks/useClerkOrMock';
import { colors } from '../../src/shared/theme/colors';
import { typography } from '../../src/shared/theme/typography';
import { spacing, radius } from '../../src/shared/theme/spacing';
import { AppHeader } from '../../src/shared/components';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ESTADOS = ['todos', 'abierto', 'en_proceso', 'resuelto'];

const ESTADO_CONFIG = {
  abierto:    { bg: '#FEF3C7', text: '#D97706', label: 'Abierto',     icon: 'alert-circle-outline' },
  en_proceso: { bg: '#EFF6FF', text: colors.primary, label: 'En proceso', icon: 'time-outline' },
  resuelto:   { bg: '#F0FDF4', text: '#16A34A', label: 'Resuelto',    icon: 'checkmark-circle-outline' },
};

const GRAVEDAD_CONFIG = {
  alta:  { color: colors.danger, icon: 'flame-outline' },
  media: { color: '#D97706',    icon: 'warning-outline' },
  baja:  { color: '#16A34A',    icon: 'information-circle-outline' },
};

export default function ReportesTabScreen() {
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [cambiandoId, setCambiandoId] = useState(null);

  if (!authLoaded || !userLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'docente';

  // Admin y Ayudante ven TODOS los reportes; el resto solo los suyos
  const esGestor = rol === 'admin' || rol === 'ayudante';
  const endpoint = esGestor ? '/api/v1/reportes/' : '/api/v1/reportes/mis-reportes';

  const cargarReportes = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      const token = await getToken();

      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Error al cargar reportes');

      setReportes(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudieron cargar los reportes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, endpoint]);

  useEffect(() => { cargarReportes(); }, [cargarReportes]);

  const cambiarEstado = async (reporteId, nuevoEstado) => {
    try {
      setCambiandoId(reporteId);
      const token = await getToken();

      const res = await fetch(
        `${API_URL}/api/v1/reportes/${reporteId}/estado?nuevo_estado=${nuevoEstado}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.detail || 'No se pudo actualizar el estado');
      }

      // Actualiza localmente sin recargar todo
      setReportes((prev) =>
        prev.map((r) => (r.id === reporteId ? { ...r, estado: nuevoEstado } : r))
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo cambiar el estado.');
    } finally {
      setCambiandoId(null);
    }
  };

  const siguienteEstado = (estadoActual) => {
    const flujo = { abierto: 'en_proceso', en_proceso: 'resuelto', resuelto: 'abierto' };
    return flujo[estadoActual] || 'en_proceso';
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-EC', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  };

  const reportesFiltrados = filtroEstado === 'todos'
    ? reportes
    : reportes.filter((r) => r.estado === filtroEstado);

  const renderReporte = ({ item }) => {
    const estadoCfg = ESTADO_CONFIG[item.estado] || ESTADO_CONFIG.abierto;
    const gravedadCfg = GRAVEDAD_CONFIG[item.gravedad] || GRAVEDAD_CONFIG.media;
    const cargando = cambiandoId === item.id;

    return (
      <View style={styles.card}>
        {/* Fila superior: código + badge estado */}
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.codigo}>{item.codigo || `TK-???`}</Text>
            <Text style={styles.fecha}>{formatFecha(item.fecha_reporte)}</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: estadoCfg.bg }]}>
            <Ionicons name={estadoCfg.icon} size={13} color={estadoCfg.text} />
            <Text style={[styles.estadoText, { color: estadoCfg.text }]}>{estadoCfg.label}</Text>
          </View>
        </View>

        {/* Espacio afectado */}
        <View style={styles.espacioRow}>
          <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.espacioText} numberOfLines={1}>
            {item.espacio_nombre || `Espacio ${item.espacio_id?.slice(-6) || '—'}`}
          </Text>
        </View>

        {/* Descripción */}
        <Text style={styles.descripcion} numberOfLines={2}>
          {item.descripcion || 'Sin descripción.'}
        </Text>

        {/* Gravedad + docente */}
        <View style={styles.metaRow}>
          <View style={styles.gravedadPill}>
            <Ionicons name={gravedadCfg.icon} size={13} color={gravedadCfg.color} />
            <Text style={[styles.gravedadText, { color: gravedadCfg.color }]}>
              {item.gravedad ? item.gravedad.charAt(0).toUpperCase() + item.gravedad.slice(1) : 'Media'}
            </Text>
          </View>
          {item.docente_nombre && (
            <Text style={styles.docenteText} numberOfLines={1}>
              👤 {item.docente_nombre}
            </Text>
          )}
        </View>

        {/* Botón cambio de estado — solo para gestores */}
        {esGestor && item.estado !== 'resuelto' && (
          <TouchableOpacity
            style={[styles.accionBtn, { borderColor: estadoCfg.text }]}
            onPress={() => cambiarEstado(item.id, siguienteEstado(item.estado))}
            disabled={cargando}
          >
            {cargando
              ? <ActivityIndicator size="small" color={estadoCfg.text} />
              : <>
                  <Ionicons name="arrow-forward-circle-outline" size={16} color={estadoCfg.text} />
                  <Text style={[styles.accionText, { color: estadoCfg.text }]}>
                    Marcar como {ESTADO_CONFIG[siguienteEstado(item.estado)]?.label}
                  </Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <AppHeader rol={rol} onNotifPress={() => cargarReportes(true)} />

      {/* Chips de filtro */}
      <View style={styles.filtroRow}>
        {ESTADOS.map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.filtroChip, filtroEstado === e && styles.filtroChipActive]}
            onPress={() => setFiltroEstado(e)}
          >
            <Text style={[styles.filtroText, filtroEstado === e && styles.filtroTextActive]}>
              {e === 'todos' ? 'Todos' : ESTADO_CONFIG[e]?.label || e}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reportesFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={renderReporte}
          contentContainerStyle={reportesFiltrados.length === 0 ? styles.emptyContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); cargarReportes(true); }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="document-outline" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin reportes</Text>
              <Text style={styles.emptyMsg}>
                {filtroEstado === 'todos'
                  ? 'No hay reportes registrados todavía.'
                  : `No hay reportes con estado "${ESTADO_CONFIG[filtroEstado]?.label}".`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  filtroRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtroChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtroChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroText: {
    fontSize: 12,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
  },
  filtroTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  codigo: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  fecha: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },
  espacioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  espacioText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  descripcion: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  gravedadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gravedadText: {
    fontSize: 12,
    fontWeight: typography.weight.bold,
  },
  docenteText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    maxWidth: '55%',
  },
  accionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
  accionText: {
    fontSize: 12,
    fontWeight: typography.weight.bold,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyMsg: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});