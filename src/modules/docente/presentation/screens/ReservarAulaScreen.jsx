import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || 'No se pudieron cargar las aulas.');
      }

      setEspacios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando espacios:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar las aulas.');
    } finally {
      setLoadingEspacios(false);
    }
  };

  const generarFechas = () => {
    const fechas = [];

    for (let i = 0; i < 15; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + i);

      const year = fecha.getFullYear();
      const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
      const day = `${fecha.getDate()}`.padStart(2, '0');

      const valor = `${year}-${month}-${day}`;

      fechas.push({
        valor,
        label:
          i === 0
            ? `Hoy · ${valor}`
            : i === 1
            ? `Mañana · ${valor}`
            : valor,
      });
    }

    return fechas;
  };

  const generarHoras = () => {
    const horas = [];

    for (let h = 7; h <= 22; h++) {
      horas.push(`${String(h).padStart(2, '0')}:00`);
      horas.push(`${String(h).padStart(2, '0')}:30`);
    }

    return horas;
  };

  const crearReserva = async () => {
    if (!espacioSeleccionado?.id) {
      Alert.alert('Campo requerido', 'Selecciona el aula que deseas reservar.');
      return;
    }

    if (!fechaSeleccionada) {
      Alert.alert('Campo requerido', 'Selecciona la fecha de la reserva.');
      return;
    }

    if (!horaInicio || !horaFin) {
      Alert.alert('Campo requerido', 'Selecciona la hora de inicio y la hora de fin.');
      return;
    }

    const horaInicioFinal = `${fechaSeleccionada}T${horaInicio}:00`;
    const horaFinFinal = `${fechaSeleccionada}T${horaFin}:00`;

    if (new Date(horaFinFinal) <= new Date(horaInicioFinal)) {
      Alert.alert(
        'Horario inválido',
        'La hora de fin debe ser posterior a la hora de inicio.'
      );
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        espacio_id: espacioSeleccionado.id,
        materia,
        hora_inicio: horaInicioFinal,
        hora_fin: horaFinFinal,
      };

      const response = await fetch(`${API_URL}/api/v1/reservas/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || 'No se pudo crear la reserva.');
      }

      Alert.alert('Reserva creada', 'El aula fue reservada correctamente.');
      onBack();
    } catch (error) {
      console.error('Error creando reserva:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la reserva.');
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
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{item.nombre || 'Aula sin nombre'}</Text>
        <Text style={styles.optionSub}>
          {item.bloque ? `${item.bloque} · ` : ''}
          {item.ubicacion || item.tipo || 'Sin ubicación'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderFecha = ({ item }) => (
    <TouchableOpacity
      style={styles.optionCard}
      onPress={() => {
        setFechaSeleccionada(item.valor);
        setModalFechaVisible(false);
      }}
    >
      <Text style={styles.optionTitle}>{item.label}</Text>
      <Ionicons name="calendar-outline" size={18} color="#2F80ED" />
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
      <Text style={styles.optionTitle}>{item}</Text>
      <Ionicons name="time-outline" size={18} color="#2F80ED" />
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
      <Text style={styles.optionTitle}>{item}</Text>
      <Ionicons name="time-outline" size={18} color="#2F80ED" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.appShell}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.navbar}>
          <View style={styles.brandRow}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Ionicons name="arrow-back" size={22} color="#2F80ED" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Ionicons name="school" size={18} color="#FFFFFF" />
            </View>

            <Text style={styles.brandText}>Axis</Text>
          </View>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Profesor</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.mainTitle}>Reservar aula</Text>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nueva reserva</Text>

            <Text style={styles.inputLabel}>Aula</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setModalAulasVisible(true)}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.selectText,
                    !espacioSeleccionado && styles.placeholderText,
                  ]}
                >
                  {loadingEspacios
                    ? 'Cargando aulas...'
                    : espacioSeleccionado?.nombre || 'Seleccionar aula'}
                </Text>

                {espacioSeleccionado && (
                  <Text style={styles.selectSubText}>
                    {espacioSeleccionado.bloque
                      ? `${espacioSeleccionado.bloque} · `
                      : ''}
                    {espacioSeleccionado.ubicacion || espacioSeleccionado.tipo || ''}
                  </Text>
                )}
              </View>

              {loadingEspacios ? (
                <ActivityIndicator size="small" color="#2F80ED" />
              ) : (
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Materia</Text>
            <View style={styles.selectBox}>
              <Text style={styles.selectText}>{materia}</Text>
              <Ionicons name="book-outline" size={20} color="#6B7280" />
            </View>

            <Text style={styles.inputLabel}>Fecha</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setModalFechaVisible(true)}
            >
              <Text
                style={[
                  styles.selectText,
                  !fechaSeleccionada && styles.placeholderText,
                ]}
              >
                {fechaSeleccionada || 'Seleccionar fecha'}
              </Text>

              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            </TouchableOpacity>

            <View style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.inputLabel}>Hora inicio</Text>

                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setModalHoraInicioVisible(true)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      !horaInicio && styles.placeholderText,
                    ]}
                  >
                    {horaInicio || 'Inicio'}
                  </Text>

                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.timeColumn}>
                <Text style={styles.inputLabel}>Hora fin</Text>

                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setModalHoraFinVisible(true)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      !horaFin && styles.placeholderText,
                    ]}
                  >
                    {horaFin || 'Fin'}
                  </Text>

                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, guardando && styles.disabledBtn]}
              onPress={crearReserva}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Crear reserva</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem} onPress={onBack}>
            <Ionicons name="business-outline" size={22} color="#828282" />
            <Text style={styles.tabLabel}>Mi Aula</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="add-circle" size={22} color="#2F80ED" />
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>Reservar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="chatbox-ellipses-outline" size={22} color="#828282" />
            <Text style={styles.tabLabel}>Asistente IA</Text>
          </TouchableOpacity>
        </View>

        <SelectorModal
          visible={modalAulasVisible}
          title="Seleccionar aula"
          onClose={() => setModalAulasVisible(false)}
          data={espacios}
          renderItem={renderAula}
          emptyText="No hay aulas registradas."
        />

        <SelectorModal
          visible={modalFechaVisible}
          title="Seleccionar fecha"
          onClose={() => setModalFechaVisible(false)}
          data={generarFechas()}
          renderItem={renderFecha}
          emptyText="No hay fechas disponibles."
        />

        <SelectorModal
          visible={modalHoraInicioVisible}
          title="Hora de inicio"
          onClose={() => setModalHoraInicioVisible(false)}
          data={generarHoras()}
          renderItem={renderHoraInicio}
          emptyText="No hay horas disponibles."
        />

        <SelectorModal
          visible={modalHoraFinVisible}
          title="Hora de fin"
          onClose={() => setModalHoraFinVisible(false)}
          data={generarHoras()}
          renderItem={renderHoraFin}
          emptyText="No hay horas disponibles."
        />
      </View>
    </SafeAreaView>
  );
}

function SelectorModal({ visible, title, onClose, data, renderItem, emptyText }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>

            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          {data?.length > 0 ? (
            <FlatList
              data={data}
              keyExtractor={(item, index) =>
                typeof item === 'string'
                  ? `${item}-${index}`
                  : item.id || item.valor || index.toString()
              }
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyModal}>
              <Ionicons name="file-tray-outline" size={34} color="#BDBDBD" />
              <Text style={styles.emptyModalText}>{emptyText}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
  },

  appShell: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#F9FAFC',
  },

  navbar: {
    height: 62,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backBtn: {
    marginRight: 10,
  },

  logoContainer: {
    backgroundColor: '#2F80ED',
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  roleBadge: {
    backgroundColor: '#EAF2FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },

  roleText: {
    fontSize: 11,
    color: '#2F80ED',
    fontWeight: '700',
  },

  scrollContent: {
    flex: 1,
  },

  scrollInner: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },

  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },

  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
  },

  inputLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 8,
  },

  selectBox: {
    minHeight: 54,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },

  selectSubText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  placeholderText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },

  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },

  timeColumn: {
    flex: 1,
  },

  submitBtn: {
    backgroundColor: '#2F80ED',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },

  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  disabledBtn: {
    opacity: 0.6,
  },

  bottomTab: {
    height: 62,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },

  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },

  tabLabel: {
    fontSize: 11,
    color: '#828282',
    marginTop: 4,
  },

  tabLabelActive: {
    color: '#2F80ED',
    fontWeight: '700',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  modalContent: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '72%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  optionCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  optionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },

  emptyModal: {
    paddingVertical: 30,
    alignItems: 'center',
  },

  emptyModalText: {
    fontSize: 13,
    color: '#828282',
    marginTop: 8,
  },
});