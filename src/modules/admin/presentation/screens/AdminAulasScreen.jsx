import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader } from '../../../../shared/components';

import {
  obtenerAulasAdmin,
  crearAulaAdmin,
  actualizarAulaAdmin,
  cambiarEstadoAulaAdmin,
} from '../../services/adminApi';

import AulaCard from '../components/aulas/AulaCard';
import AulaFormModal from '../components/aulas/AulaFormModal';
import AulaStatusModal from '../components/aulas/AulaStatusModal';
import AulaSummaryCompact from '../components/aulas/AulaSummaryCompact';
import AdminToast from '../components/aulas/AdminToast';
import SkeletonAulas from '../components/aulas/SkeletonAulas';

const CLERK_JWT_TEMPLATE = 'Axis';

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'disponible', label: 'Disponibles' },
  { key: 'ocupado', label: 'Ocupadas' },
  { key: 'mantenimiento', label: 'Mantenimiento' },
];

const FORM_INICIAL = {
  nombre: '',
  ubicacion: '',
  bloque: '',
  capacidad: '',
  tipo: 'aula',

  proyector: false,
  computadoras: false,
  cantidadComputadoras: '',
  parlantes: false,
  pizarra: false,

  equipamientoTexto: '',
  estado_actual: 'disponible',
};

export default function AdminAulasScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [guardandoFormulario, setGuardandoFormulario] = useState(false);
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [estadoGuardando, setEstadoGuardando] = useState(null);

  const [error, setError] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('todos');

  const [modalFormularioVisible, setModalFormularioVisible] = useState(false);
  const [modalEstadoVisible, setModalEstadoVisible] = useState(false);

  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);
  const [modoFormulario, setModoFormulario] = useState('crear');
  const [form, setForm] = useState(FORM_INICIAL);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastTipo, setToastTipo] = useState('success');
  const [toastMensaje, setToastMensaje] = useState('');

  const obtenerTokenActual = async () => {
    const token = await getToken({
      template: CLERK_JWT_TEMPLATE,
      skipCache: true,
    });

    if (!token) {
      throw new Error('No se pudo obtener una sesión activa.');
    }

    return token;
  };

  const mostrarToast = ({ tipo = 'success', mensaje }) => {
    setToastTipo(tipo);
    setToastMensaje(mensaje);
    setToastVisible(false);

    setTimeout(() => {
      setToastVisible(true);
    }, 80);
  };

  const cargarAulas = async ({ silencioso = false } = {}) => {
    try {
      if (!silencioso) {
        setLoading(true);
      }

      setError('');

      const token = await obtenerTokenActual();
      const data = await obtenerAulasAdmin(token);

      setAulas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando aulas admin:', err);
      setError(err.message || 'No se pudieron cargar las aulas.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarAulas({ silencioso: true });
    }, [])
  );

  const limpiarFormulario = () => {
    setForm(FORM_INICIAL);
    setAulaSeleccionada(null);
    setModoFormulario('crear');
  };

  const abrirCrearAula = () => {
    limpiarFormulario();
    setFormError('');
    setModoFormulario('crear');
    setModalFormularioVisible(true);
  };

  const abrirEditarAula = (aula) => {

    const equipamientoLista = Array.isArray(aula.equipamiento)
      ? aula.equipamiento
      : [];

    const tieneProyector = equipamientoLista.some((item) =>
      String(item).toLowerCase().includes('proyector')
    );

    const tieneParlantes = equipamientoLista.some((item) =>
      String(item).toLowerCase().includes('parlantes')
    );

    const tienePizarra = equipamientoLista.some((item) =>
      String(item).toLowerCase().includes('pizarra')
    );

    const computadorasItem = equipamientoLista.find((item) =>
      String(item).toLowerCase().includes('computadoras')
    );

    const cantidadComputadoras = computadorasItem
      ? String(computadorasItem).replace(/\D/g, '')
      : '';

    setAulaSeleccionada(aula);
    setModoFormulario('editar');
    setFormError('');

    setForm({
      nombre: aula.nombre || '',
      ubicacion: aula.ubicacion || '',
      bloque: aula.bloque || '',
      capacidad: aula.capacidad ? String(aula.capacidad) : '',
      tipo: aula.tipo || '',
      equipamientoTexto: '',
      proyector: tieneProyector,
      parlantes: tieneParlantes,
      pizarra: tienePizarra,
      computadoras: Boolean(computadorasItem),
      cantidadComputadoras,
      estado_actual: aula.estado_actual || 'disponible',
    });

    setModalFormularioVisible(true);
  };

  const abrirCambiarEstado = (aula) => {
    setAulaSeleccionada(aula);
    setEstadoGuardando(null);
    setModalEstadoVisible(true);
  };

  const cerrarFormulario = () => {
    if (guardandoFormulario) return;

    setModalFormularioVisible(false);
    limpiarFormulario();
  };

  const actualizarCampo = (campo, valor) => {
    setFormError('');

    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const construirPayload = () => {
    const equipamiento = [];

    if (form.proyector) {
      equipamiento.push('proyector');
    }

    if (form.computadoras) {
      equipamiento.push(
        `computadoras: ${Number(form.cantidadComputadoras || 0)}`
      );
    }

    if (form.parlantes) {
      equipamiento.push('parlantes');
    }

    if (form.pizarra) {
      equipamiento.push('pizarra');
    }

    const extras = form.equipamientoTexto
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    equipamiento.push(...extras);

    return {
      nombre: form.nombre.trim(),
      ubicacion: form.ubicacion.trim(),
      bloque: form.bloque.trim(),
      capacidad: Number(form.capacidad),
      tipo: form.tipo,
      equipamiento,
      estado_actual: form.estado_actual,
    };
  };

  const validarFormulario = () => {
    if (!form.nombre.trim()) {
      return 'Ingresa el nombre del aula.';
    }

    if (!form.ubicacion.trim()) {
      return 'Ingresa la ubicación del aula.';
    }

    if (!form.bloque.trim()) {
      return 'Ingresa el bloque del aula.';
    }

    if (!['aula', 'laboratorio'].includes(form.tipo)) {
      return 'Selecciona un tipo válido: aula o laboratorio.';
    }

    if (!form.capacidad || Number.isNaN(Number(form.capacidad))) {
      return 'Ingresa una capacidad válida.';
    }

    if (Number(form.capacidad) < 0) {
      return 'La capacidad no puede ser negativa.';
    }

    if (
      form.computadoras &&
      (!form.cantidadComputadoras ||
        Number.isNaN(Number(form.cantidadComputadoras)) ||
        Number(form.cantidadComputadoras) <= 0)
    ) {
      return 'Ingresa la cantidad de computadoras.';
    }

    return null;
  };

  const guardarAula = async () => {
    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setFormError(errorValidacion);
      return;
    }

    try {
      setGuardandoFormulario(true);

      const token = await obtenerTokenActual();
      const payload = construirPayload();

      if (modoFormulario === 'crear') {
        await crearAulaAdmin(token, payload);

        mostrarToast({
          tipo: 'success',
          mensaje: 'Aula creada correctamente.',
        });
      } else {
        await actualizarAulaAdmin(token, aulaSeleccionada.id, payload);

        mostrarToast({
          tipo: 'success',
          mensaje: 'Aula actualizada correctamente.',
        });
      }

      setModalFormularioVisible(false);
      limpiarFormulario();

      await cargarAulas({ silencioso: true });
    } catch (err) {
      console.error('Error guardando aula:', err);

      mostrarToast({
        tipo: 'error',
        mensaje: err.message || 'No se pudo guardar el aula.',
      });
    } finally {
      setGuardandoFormulario(false);
    }
  };

  const guardarEstado = async (nuevoEstado) => {
    if (!aulaSeleccionada?.id) {
      mostrarToast({
        tipo: 'error',
        mensaje: 'No se pudo identificar el aula.',
      });
      return;
    }

    if (aulaSeleccionada.estado_actual === nuevoEstado) {
      mostrarToast({
        tipo: 'info',
        mensaje: 'El aula ya tiene ese estado.',
      });
      return;
    }

    try {
      setGuardandoEstado(true);
      setEstadoGuardando(nuevoEstado);

      const token = await obtenerTokenActual();

      await cambiarEstadoAulaAdmin(token, aulaSeleccionada.id, nuevoEstado);

      mostrarToast({
        tipo: 'success',
        mensaje: 'Estado actualizado correctamente.',
      });

      await cargarAulas({ silencioso: true });

      setModalEstadoVisible(false);
      setAulaSeleccionada(null);
      setEstadoGuardando(null);
    } catch (err) {
      console.error('Error cambiando estado aula:', err);

      mostrarToast({
        tipo: 'error',
        mensaje: err.message || 'No se pudo cambiar el estado.',
      });
    } finally {
      setGuardandoEstado(false);
      setEstadoGuardando(null);
    }
  };

  const aulasDisponibles = aulas.filter(
    (item) => item.estado_actual === 'disponible'
  ).length;

  const aulasOcupadas = aulas.filter(
    (item) => item.estado_actual === 'ocupado'
  ).length;

  const aulasMantenimiento = aulas.filter(
    (item) => item.estado_actual === 'mantenimiento'
  ).length;

  const aulasFiltradas = aulas.filter((item) => {
    if (filtroActivo === 'todos') return true;
    return item.estado_actual === filtroActivo;
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AdminToast
        visible={toastVisible}
        tipo={toastTipo}
        mensaje={toastMensaje}
        onHide={() => setToastVisible(false)}
      />

      <AppHeader
        rol="admin"
        onNotifPress={() => cargarAulas({ silencioso: false })}
        onProfilePress={() => router.push('/(admin)/perfil')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleTextBox}>
            <Text style={styles.title}>Aulas</Text>
            <Text style={styles.subtitle}>Gestión de espacios académicos.</Text>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={abrirCrearAula}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.addBtnText}>Nueva</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <SkeletonAulas />
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />

            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => cargarAulas({ silencioso: false })}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <AulaSummaryCompact
              total={aulas.length}
              disponibles={aulasDisponibles}
              ocupadas={aulasOcupadas}
              mantenimiento={aulasMantenimiento}
            />

            <View style={styles.filterWrap}>
              {FILTROS.map((item) => {
                const active = filtroActivo === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
                    onPress={() => setFiltroActivo(item.key)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Listado de aulas</Text>
              <Text style={styles.sectionCounter}>
                {aulasFiltradas.length} registros
              </Text>
            </View>

            {aulasFiltradas.length > 0 ? (
              aulasFiltradas.map((item) => (
                <AulaCard
                  key={item.id || item._id || item.nombre}
                  aula={item}
                  onEditar={() => abrirEditarAula(item)}
                  onEstado={() => abrirCambiarEstado(item)}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="file-tray-outline"
                  size={34}
                  color={colors.textMuted}
                />

                <Text style={styles.emptyTitle}>Sin aulas</Text>

                <Text style={styles.emptyText}>
                  No hay espacios registrados para este filtro.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <AulaFormModal
        visible={modalFormularioVisible}
        modo={modoFormulario}
        form={form}
        guardando={guardandoFormulario}
        errorMensaje={formError}
        onChange={actualizarCampo}
        onClose={cerrarFormulario}
        onSubmit={guardarAula}
      />

      <AulaStatusModal
        visible={modalEstadoVisible}
        aula={aulaSeleccionada}
        guardando={guardandoEstado}
        estadoGuardando={estadoGuardando}
        onClose={() => {
          if (!guardandoEstado) {
            setModalEstadoVisible(false);
            setAulaSeleccionada(null);
            setEstadoGuardando(null);
          }
        }}
        onSelect={guardarEstado}
      />
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

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  titleTextBox: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },

  addBtn: {
    minHeight: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  addBtnText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },

  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },

  filterText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
  },

  filterTextActive: {
    color: colors.primary,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  sectionCounter: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },

  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: spacing.lg,
    alignItems: 'center',
  },

  errorText: {
    marginTop: spacing.sm,
    fontSize: typography.size.sm,
    color: '#DC2626',
    textAlign: 'center',
  },

  retryBtn: {
    marginTop: spacing.md,
    minHeight: 42,
    borderRadius: radius.md,
    backgroundColor: '#DC2626',
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  retryText: {
    color: colors.white,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sm,
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },

  emptyText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});