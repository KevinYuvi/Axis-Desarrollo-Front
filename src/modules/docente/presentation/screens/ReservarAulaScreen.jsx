import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ReservarAulaScreen({ token, onBack }) {
  const [espacios, setEspacios] = useState([]);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(null);

  const [materia] = useState('Programación Móvil');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaInicio, setHoraInicio] = useState(null);
  const [horaFin, setHoraFin] = useState(null);

  const [loadingEspacios, setLoadingEspacios] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [modalAulasVisible, setModalAulasVisible] = useState(false);
  const [modalFechaVisible, setModalFechaVisible] = useState(false);
  const [modalHoraInicioVisible, setModalHoraInicioVisible] = useState(false);
  const [modalHoraFinVisible, setModalHoraFinVisible] = useState(false);

  useEffect(() => {
    cargarEspacios();
  }, []);

  const cargarEspacios = async () => {
    try {
      setLoadingEspacios(true);
      const response = await fetch(`${API_URL}/api/v1/espacios/`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || 'No se pudieron cargar las aulas.');
      setEspacios(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudieron cargar las aulas.');
    } finally {
      setLoadingEspacios(false);
    }
  };

  const generarFechas = () => {
    const fechas = [];
    const hoy = new Date();
    for (let i = 0; i < 7; i++) {
      const f = new Date(hoy);
      f.setDate(f.getDate() + i);
      fechas.push(f.toISOString().split('T')[0]);
    }
    return fechas;
  };

  const generarHoras = () => {
    const horas = [];
    for (let h = 7; h <= 20; h++) {
      const hrStr = h.toString().padStart(2, '0');
      horas.push(`${hrStr}:00`);
      horas.push(`${hrStr}:30`);
    }
    return horas;
  };

  const crearReserva = async () => {
    if (!espacioSeleccionado || !fechaSeleccionada || !horaInicio || !horaFin) {
      Alert.alert('Incompleto', 'Debes seleccionar aula, fecha y horario.');
      return;
    }

    try {
      setGuardando(true);
      const startIso = new Date(`${fechaSeleccionada}T${horaInicio}:00.000Z`);
      const endIso = new Date(`${fechaSeleccionada}T${horaFin}:00.000Z`);

      startIso.setHours(startIso.getHours() + 5);
      endIso.setHours(endIso.getHours() + 5);

      const bodyData = {
        espacio_id: espacioSeleccionado.id,
        materia,
        hora_inicio: startIso.toISOString(),
        hora_fin: endIso.toISOString(),
      };

      const response = await fetch(`${API_URL}/api/v1/reservas/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || 'No se pudo crear la reserva.');
      }

      Alert.alert('Éxito', 'La reserva fue creada exitosamente.', [
        { text: 'OK', onPress: onBack },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Ocurrió un error al reservar.');
    } finally {
      setGuardando(false);
    }
  };

  const renderAula = ({ item }) => (
    <TouchableOpacity
      style={styles.optionCard}
      onPress={() => {
        setEspacioSeleccionado(item);
        setModalAulasVisible(false);
      }}
    >
      <Ionicons name="business" size={24} color={colors.primary} style={{ marginRight: spacing.sm }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{item.nombre}</Text>
        <Text style={styles.optionSub}>Capacidad: {item.capacidad || 0} personas</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFecha = ({ item }) => (
    <TouchableOpacity
      style={styles.optionCard}
      onPress={() => {
        setFechaSeleccionada(item);
        setModalFechaVisible(false);
      }}
    >
      <Ionicons name="calendar-outline" size={22} color={colors.primary} style={{ marginRight: spacing.sm }} />
      <Text style={styles.optionTitle}>{item}</Text>
    </TouchableOpacity>
  );

  const renderHoraInicio = ({ item }) => (
    <TouchableOpacity
      style={styles.optionCard}
      onPress={() => {
        setHoraInicio(item);
        setModalHoraInicioVisible(false);
      }}
    >
      <Ionicons name="time-outline" size={22} color={colors.primary} style={{ marginRight: spacing.sm }} />
      <Text style={styles.optionTitle}>{item}</Text>
    </TouchableOpacity>
  );

  const renderHoraFin = ({ item }) => (
    <TouchableOpacity
      style={styles.optionCard}
      onPress={() => {
        setHoraFin(item);
        setModalHoraFinVisible(false);
      }}
    >
      <Ionicons name="time-outline" size={22} color={colors.primary} style={{ marginRight: spacing.sm }} />
      <Text style={styles.optionTitle}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Reserva</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainTitle}>Agendar Aula</Text>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Detalles de la Reserva</Text>

          <Text style={styles.inputLabel}>Materia</Text>
          <View style={styles.selectBox}>
            <Text style={styles.selectText}>{materia}</Text>
            <Ionicons name="book-outline" size={20} color={colors.textSecondary} />
          </View>

          <Text style={styles.inputLabel}>Aula / Laboratorio</Text>
          <TouchableOpacity style={styles.selectBox} onPress={() => setModalAulasVisible(true)} disabled={loadingEspacios}>
            <View>
              <Text style={[styles.selectText, !espacioSeleccionado && styles.placeholderText]}>
                {espacioSeleccionado?.nombre || 'Seleccionar espacio'}
              </Text>
              {espacioSeleccionado && (
                <Text style={styles.selectSubText}>Cap. {espacioSeleccionado.capacidad} | {espacioSeleccionado.estado_actual}</Text>
              )}
            </View>
            {loadingEspacios ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="business-outline" size={20} color={colors.textSecondary} />}
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Fecha</Text>
          <TouchableOpacity style={styles.selectBox} onPress={() => setModalFechaVisible(true)}>
            <Text style={[styles.selectText, !fechaSeleccionada && styles.placeholderText]}>
              {fechaSeleccionada || 'Seleccionar fecha'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.inputLabel}>Hora inicio</Text>
              <TouchableOpacity style={styles.selectBox} onPress={() => setModalHoraInicioVisible(true)}>
                <Text style={[styles.selectText, !horaInicio && styles.placeholderText]}>
                  {horaInicio || 'Inicio'}
                </Text>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeColumn}>
              <Text style={styles.inputLabel}>Hora fin</Text>
              <TouchableOpacity style={styles.selectBox} onPress={() => setModalHoraFinVisible(true)}>
                <Text style={[styles.selectText, !horaFin && styles.placeholderText]}>
                  {horaFin || 'Fin'}
                </Text>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.submitBtn, guardando && styles.disabledBtn]} onPress={crearReserva} disabled={guardando}>
            {guardando ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Confirmar reserva</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SelectorModal visible={modalAulasVisible} title="Seleccionar aula" onClose={() => setModalAulasVisible(false)} data={espacios} renderItem={renderAula} emptyText="No hay aulas registradas." />
      <SelectorModal visible={modalFechaVisible} title="Seleccionar fecha" onClose={() => setModalFechaVisible(false)} data={generarFechas()} renderItem={renderFecha} emptyText="No hay fechas disponibles." />
      <SelectorModal visible={modalHoraInicioVisible} title="Hora de inicio" onClose={() => setModalHoraInicioVisible(false)} data={generarHoras()} renderItem={renderHoraInicio} emptyText="No hay horas disponibles." />
      <SelectorModal visible={modalHoraFinVisible} title="Hora de fin" onClose={() => setModalHoraFinVisible(false)} data={generarHoras()} renderItem={renderHoraFin} emptyText="No hay horas disponibles." />
    </SafeAreaView>
  );
}

function SelectorModal({ visible, title, onClose, data, renderItem, emptyText }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {data?.length > 0 ? (
            <FlatList data={data} keyExtractor={(item, index) => typeof item === 'string' ? `${item}-${index}` : item.id || index.toString()} renderItem={renderItem} showsVerticalScrollIndicator={false} />
          ) : (
            <View style={styles.emptyModal}>
              <Ionicons name="file-tray-outline" size={34} color={colors.textMuted} />
              <Text style={styles.emptyModalText}>{emptyText}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.textPrimary },
  headerSpacer: { width: 32 },
  scrollContent: { flex: 1 },
  scrollInner: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  mainTitle: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary, marginBottom: spacing.lg },
  formCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  formTitle: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.textPrimary, marginBottom: spacing.lg },
  inputLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: typography.weight.bold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginTop: 8 },
  selectBox: { minHeight: 54, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: typography.size.sm, color: colors.textPrimary, fontWeight: typography.weight.bold },
  selectSubText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  placeholderText: { color: colors.textMuted, fontWeight: typography.weight.semibold },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeColumn: { flex: 1 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: colors.white, fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  disabledBtn: { opacity: 0.6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.45)', justifyContent: 'flex-end', alignItems: 'center' },
  modalContent: { width: '100%', maxWidth: 430, maxHeight: '72%', backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.textPrimary },
  optionCard: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  optionTitle: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary },
  optionSub: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  emptyModal: { paddingVertical: 30, alignItems: 'center' },
  emptyModalText: { fontSize: 13, color: colors.textSecondary, marginTop: 8 },
});