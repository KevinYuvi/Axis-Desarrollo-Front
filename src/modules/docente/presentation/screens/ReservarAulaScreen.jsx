import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
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

  const [modalFeedbackVisible, setModalFeedbackVisible] = useState(false);
  const [feedbackTipo, setFeedbackTipo] = useState('info');
  const [feedbackTitulo, setFeedbackTitulo] = useState('');
  const [feedbackMensaje, setFeedbackMensaje] = useState('');
  const [feedbackAccion, setFeedbackAccion] = useState(null);

  useEffect(() => {
    if (token) {
      cargarEspacios();
    }
  }, [token]);

  const mostrarFeedback = ({
    tipo = 'info',
    titulo,
    mensaje,
    accion = null,
  }) => {
    setFeedbackTipo(tipo);
    setFeedbackTitulo(titulo);
    setFeedbackMensaje(mensaje);
    setFeedbackAccion(() => accion);
    setModalFeedbackVisible(true);
  };

  const cerrarFeedback = () => {
    setModalFeedbackVisible(false);

    if (feedbackAccion) {
      feedbackAccion();
    }

    setFeedbackAccion(null);
  };

  const cargarEspacios = async () => {
    try {
      setLoadingEspacios(true);

      if (!API_URL) {
        throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
      }

      if (!token) {
        throw new Error('No se encontró el token de sesión.');
      }

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

      mostrarFeedback({
        tipo: 'error',
        titulo: 'Error',
        mensaje: error.message || 'No se pudieron cargar las aulas.',
      });
    } finally {
      setLoadingEspacios(false);
    }
  };

  const formatearFechaLocal = (fecha) => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const construirFechaHoraLocal = (fechaTexto, horaTexto) => {
    const [hora, minuto] = String(horaTexto).split(':');

    return `${fechaTexto}T${String(hora).padStart(2, '0')}:${String(
      minuto || '00'
    ).padStart(2, '0')}:00`;
  };

  const convertirMinutos = (horaTexto) => {
    const [hora, minuto] = String(horaTexto).split(':').map(Number);
    return hora * 60 + minuto;
  };

  const generarFechas = () => {
    const fechas = [];
    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      fechas.push(formatearFechaLocal(fecha));
    }

    return fechas;
  };

  const generarHoras = () => {
    const horas = [];

    for (let h = 0; h <= 23; h++) {
      const hora = h.toString().padStart(2, '0');

      horas.push(`${hora}:00`);
      horas.push(`${hora}:30`);
    }

    return horas;
  };

  const crearReserva = async () => {
    if (!espacioSeleccionado || !fechaSeleccionada || !horaInicio || !horaFin) {
      mostrarFeedback({
        tipo: 'warning',
        titulo: 'Datos incompletos',
        mensaje: 'Selecciona aula, fecha y horario para continuar.',
      });
      return;
    }

    const inicioMinutos = convertirMinutos(horaInicio);
    const finMinutos = convertirMinutos(horaFin);

    if (finMinutos <= inicioMinutos) {
      mostrarFeedback({
        tipo: 'warning',
        titulo: 'Horario inválido',
        mensaje: 'La hora de fin debe ser posterior a la hora de inicio.',
      });
      return;
    }

    try {
      setGuardando(true);

      if (!API_URL) {
        throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
      }

      if (!token) {
        throw new Error('No se encontró el token de sesión.');
      }

      const bodyData = {
        espacio_id: espacioSeleccionado.id,
        materia,
        hora_inicio: construirFechaHoraLocal(fechaSeleccionada, horaInicio),
        hora_fin: construirFechaHoraLocal(fechaSeleccionada, horaFin),
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

      mostrarFeedback({
        tipo: 'success',
        titulo: 'Reserva creada',
        mensaje: 'El aula fue reservada correctamente.',
        accion: onBack,
      });
    } catch (error) {
      console.error('Error creando reserva:', error);

      mostrarFeedback({
        tipo: 'error',
        titulo: 'No se pudo reservar',
        mensaje: error.message || 'Ocurrió un error al crear la reserva.',
      });
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
      activeOpacity={0.85}
    >
      <View style={styles.optionIconBox}>
        <Ionicons name="business-outline" size={21} color={colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{item.nombre}</Text>

        <Text style={styles.optionSub}>
          Capacidad: {item.capacidad || 0} personas
        </Text>

        <Text style={styles.optionSub}>
          {item.bloque || 'Sin bloque'} · {item.estado_actual || 'disponible'}
        </Text>
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
      activeOpacity={0.85}
    >
      <View style={styles.optionIconBox}>
        <Ionicons name="calendar-outline" size={21} color={colors.primary} />
      </View>

      <Text style={styles.optionTitle}>{item}</Text>
    </TouchableOpacity>
  );

  const renderHoraInicio = ({ item }) => (
    <TouchableOpacity
      style={styles.optionCard}
      onPress={() => {
        setHoraInicio(item);
        setModalHoraInicioVisible(false);

        if (horaFin && convertirMinutos(horaFin) <= convertirMinutos(item)) {
          setHoraFin(null);
        }
      }}
      activeOpacity={0.85}
    >
      <View style={styles.optionIconBox}>
        <Ionicons name="time-outline" size={21} color={colors.primary} />
      </View>

      <Text style={styles.optionTitle}>{item}</Text>
    </TouchableOpacity>
  );

  const renderHoraFin = ({ item }) => (
    <TouchableOpacity
      style={styles.optionCard}
      onPress={() => {
        if (
          horaInicio &&
          convertirMinutos(item) <= convertirMinutos(horaInicio)
        ) {
          mostrarFeedback({
            tipo: 'warning',
            titulo: 'Horario inválido',
            mensaje: 'La hora de fin debe ser posterior a la hora de inicio.',
          });
          return;
        }

        setHoraFin(item);
        setModalHoraFinVisible(false);
      }}
      activeOpacity={0.85}
    >
      <View style={styles.optionIconBox}>
        <Ionicons name="time-outline" size={21} color={colors.primary} />
      </View>

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

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Nueva reserva</Text>
          <Text style={styles.headerSubtitle}>Agendar aula</Text>
        </View>

        <View style={styles.headerIconBox}>
          <Ionicons name="calendar-outline" size={19} color={colors.primary} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.formTitle}>Detalles de la reserva</Text>
              <Text style={styles.formSubtitle}>
                Selecciona espacio, fecha y horario.
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>Materia</Text>

          <View style={styles.selectBox}>
            <View style={styles.selectTextBox}>
              <Text style={styles.selectText}>{materia}</Text>
            </View>

            <Ionicons
              name="book-outline"
              size={20}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.inputLabel}>Aula / Laboratorio</Text>

          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => setModalAulasVisible(true)}
            disabled={loadingEspacios}
            activeOpacity={0.85}
          >
            <View style={styles.selectTextBox}>
              <Text
                style={[
                  styles.selectText,
                  !espacioSeleccionado && styles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {espacioSeleccionado?.nombre || 'Seleccionar espacio'}
              </Text>

              {espacioSeleccionado && (
                <Text style={styles.selectSubText} numberOfLines={1}>
                  Cap. {espacioSeleccionado.capacidad} ·{' '}
                  {espacioSeleccionado.estado_actual}
                </Text>
              )}
            </View>

            {loadingEspacios ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name="business-outline"
                size={20}
                color={colors.textSecondary}
              />
            )}
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Fecha</Text>

          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => setModalFechaVisible(true)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.selectText,
                !fechaSeleccionada && styles.placeholderText,
              ]}
            >
              {fechaSeleccionada || 'Seleccionar fecha'}
            </Text>

            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.inputLabel}>Hora inicio</Text>

              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setModalHoraInicioVisible(true)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.selectText,
                    !horaInicio && styles.placeholderText,
                  ]}
                >
                  {horaInicio || 'Inicio'}
                </Text>

                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.timeColumn}>
              <Text style={styles.inputLabel}>Hora fin</Text>

              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setModalHoraFinVisible(true)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.selectText,
                    !horaFin && styles.placeholderText,
                  ]}
                >
                  {horaFin || 'Fin'}
                </Text>

                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, guardando && styles.disabledBtn]}
            onPress={crearReserva}
            disabled={guardando}
            activeOpacity={0.85}
          >
            {guardando ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Confirmar reserva</Text>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

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

      <FeedbackModal
        visible={modalFeedbackVisible}
        tipo={feedbackTipo}
        titulo={feedbackTitulo}
        mensaje={feedbackMensaje}
        onClose={cerrarFeedback}
      />
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
      <View style={styles.modalOverlayBottom}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {data?.length > 0 ? (
            <FlatList
              data={data}
              keyExtractor={(item, index) =>
                typeof item === 'string'
                  ? `${item}-${index}`
                  : item.id || index.toString()
              }
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyModal}>
              <Ionicons
                name="file-tray-outline"
                size={34}
                color={colors.textMuted}
              />

              <Text style={styles.emptyModalText}>{emptyText}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function FeedbackModal({ visible, tipo, titulo, mensaje, onClose }) {
  const config = {
    success: {
      icon: 'checkmark-circle-outline',
      color: '#16A34A',
      bg: '#DCFCE7',
      button: colors.primary,
      label: 'Aceptar',
    },
    error: {
      icon: 'alert-circle-outline',
      color: '#DC2626',
      bg: '#FEF2F2',
      button: '#DC2626',
      label: 'Entendido',
    },
    warning: {
      icon: 'warning-outline',
      color: '#D97706',
      bg: '#FEF3C7',
      button: '#D97706',
      label: 'Entendido',
    },
    info: {
      icon: 'information-circle-outline',
      color: colors.primary,
      bg: '#EFF6FF',
      button: colors.primary,
      label: 'Aceptar',
    },
  };

  const item = config[tipo] || config.info;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.feedbackOverlay}>
        <View style={styles.feedbackCard}>
          <View style={[styles.feedbackIconBox, { backgroundColor: item.bg }]}>
            <Ionicons name={item.icon} size={32} color={item.color} />
          </View>

          <Text style={styles.feedbackTitle}>{titulo}</Text>

          <Text style={styles.feedbackMessage}>{mensaje}</Text>

          <TouchableOpacity
            style={[styles.feedbackBtn, { backgroundColor: item.button }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.feedbackBtnText}>{item.label}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  headerTextBox: {
    flex: 1,
  },

  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  headerSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },

  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    flex: 1,
  },

  scrollInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  formHeader: {
    marginBottom: spacing.md,
  },

  formTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  formSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },

  inputLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 8,
  },

  selectBox: {
    minHeight: 54,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectTextBox: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  selectText: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  selectSubText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  placeholderText: {
    color: colors.textMuted,
    fontWeight: typography.weight.semibold,
  },

  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },

  timeColumn: {
    flex: 1,
  },

  submitBtn: {
    minHeight: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },

  submitBtnText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },

  disabledBtn: {
    opacity: 0.6,
  },

  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  modalContent: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '72%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
  },

  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  optionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  optionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },

  emptyModal: {
    paddingVertical: 30,
    alignItems: 'center',
  },

  emptyModalText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },

  feedbackOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  feedbackCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  feedbackIconBox: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  feedbackTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  feedbackMessage: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  feedbackBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  feedbackBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
});