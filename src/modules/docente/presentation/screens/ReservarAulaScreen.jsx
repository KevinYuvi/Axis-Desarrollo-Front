import React, { useCallback, useEffect, useState } from 'react';
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
import { useAuth } from '@clerk/clerk-expo';
import { useFocusEffect } from 'expo-router';

import { crearConexionRealtime } from '../../../../shared/realtime/realtimeClient';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const CLERK_JWT_TEMPLATE = 'Axis';

const HORA_INICIO_DIA = 7;
const HORA_FIN_DIA = 22;

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

export default function ReservarAulaScreen({ token, onBack }) {
  const { getToken } = useAuth();

  const [espacios, setEspacios] = useState([]);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(null);

  const [materia] = useState('Programación Móvil');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaInicio, setHoraInicio] = useState(null);
  const [horaFin, setHoraFin] = useState(null);

  const [loadingEspacios, setLoadingEspacios] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [modalAulasVisible, setModalAulasVisible] = useState(false);
  const [modalHoraInicioVisible, setModalHoraInicioVisible] = useState(false);
  const [modalHoraFinVisible, setModalHoraFinVisible] = useState(false);

  const [errores, setErrores] = useState({
    aula: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
  });

  const [modalFeedbackVisible, setModalFeedbackVisible] = useState(false);
  const [feedbackTipo, setFeedbackTipo] = useState('info');
  const [feedbackTitulo, setFeedbackTitulo] = useState('');
  const [feedbackMensaje, setFeedbackMensaje] = useState('');
  const [feedbackAccion, setFeedbackAccion] = useState(null);

  useFocusEffect(
    useCallback(() => {
      cargarEspacios();

      const realtime = crearConexionRealtime({
        onEvento: (evento) => {
          if (evento.tipo === 'aulas_actualizadas') {
            cargarEspacios();
          }
        },
      });

      return () => {
        realtime?.cerrar();
        limpiarFormulario();
      };
    }, [])
  );

  useEffect(() => {
    if (!modalFeedbackVisible || feedbackTipo !== 'success') return;

    const timer = setTimeout(() => {
      cerrarFeedback();
    }, 1400);

    return () => clearTimeout(timer);
  }, [modalFeedbackVisible, feedbackTipo]);

  const limpiarFormulario = () => {
    setEspacioSeleccionado(null);
    setFechaSeleccionada(null);
    setHoraInicio(null);
    setHoraFin(null);
    setModalAulasVisible(false);
    setModalHoraInicioVisible(false);
    setModalHoraFinVisible(false);
    setErrores({
      aula: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
    });
  };

  const obtenerTokenActual = async () => {
    const tokenClerk = await getToken({
      template: CLERK_JWT_TEMPLATE,
      skipCache: true,
    });

    if (tokenClerk) {
      return tokenClerk;
    }

    if (token) {
      return token;
    }

    throw new Error('No se pudo obtener una sesión activa. Vuelve a iniciar sesión.');
  };

  const leerRespuestaSegura = async (response, valorInicial = {}) => {
    const rawText = await response.text();

    if (!rawText) {
      return valorInicial;
    }

    try {
      return JSON.parse(rawText);
    } catch {
      return valorInicial;
    }
  };

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

      const tokenActual = await obtenerTokenActual();

      const response = await fetch(`${API_URL}/api/v1/espacios/`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenActual}`,
          Accept: 'application/json',
        },
      });

      const data = await leerRespuestaSegura(response, []);

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

    for (let i = 0; i < 10; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);

      const value = formatearFechaLocal(fecha);

      fechas.push({
        value,
        diaSemana: i === 0 ? 'Hoy' : DIAS_SEMANA[fecha.getDay()],
        diaNumero: fecha.getDate(),
        mes: MESES[fecha.getMonth()],
        textoCompleto: `${DIAS_SEMANA[fecha.getDay()]}, ${fecha.getDate()} ${
          MESES[fecha.getMonth()]
        }`,
      });
    }

    return fechas;
  };

  const redondearSiguienteMediaHora = (fecha) => {
    const copia = new Date(fecha);
    const minutos = copia.getMinutes();

    if (minutos === 0) {
      copia.setMinutes(30, 0, 0);
    } else if (minutos <= 30) {
      copia.setMinutes(30, 0, 0);
    } else {
      copia.setHours(copia.getHours() + 1, 0, 0, 0);
    }

    return copia;
  };

  const generarHorasDisponibles = ({ paraFin = false } = {}) => {
    if (!fechaSeleccionada) return [];

    const horas = [];
    const ahora = new Date();
    const fechaHoyTexto = formatearFechaLocal(ahora);
    const esHoy = fechaSeleccionada === fechaHoyTexto;
    const minimoHoy = redondearSiguienteMediaHora(ahora);
    const minimoHoyMinutos =
      minimoHoy.getHours() * 60 + minimoHoy.getMinutes();

    const minimoFin = horaInicio ? convertirMinutos(horaInicio) + 30 : null;

    for (let h = HORA_INICIO_DIA; h <= HORA_FIN_DIA; h++) {
      for (const minuto of [0, 30]) {
        if (h === HORA_FIN_DIA && minuto > 0) continue;

        const horaTexto = `${String(h).padStart(2, '0')}:${String(
          minuto
        ).padStart(2, '0')}`;

        const minutosActuales = h * 60 + minuto;

        if (esHoy && minutosActuales < minimoHoyMinutos) {
          continue;
        }

        if (paraFin && minimoFin !== null && minutosActuales < minimoFin) {
          continue;
        }

        horas.push(horaTexto);
      }
    }

    return horas;
  };

  const limpiarErrorCampo = (campo) => {
    setErrores((prev) => ({
      ...prev,
      [campo]: '',
    }));
  };

  const validarFormularioReserva = () => {
    const nuevosErrores = {
      aula: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
    };

    if (!espacioSeleccionado) {
      nuevosErrores.aula = 'Selecciona un aula o laboratorio.';
    }

    if (!fechaSeleccionada) {
      nuevosErrores.fecha = 'Selecciona la fecha de la reserva.';
    }

    if (!horaInicio) {
      nuevosErrores.horaInicio = 'Selecciona la hora de inicio.';
    }

    if (!horaFin) {
      nuevosErrores.horaFin = 'Selecciona la hora de fin.';
    }

    if (horaInicio && horaFin) {
      const inicioMinutos = convertirMinutos(horaInicio);
      const finMinutos = convertirMinutos(horaFin);

      if (finMinutos <= inicioMinutos) {
        nuevosErrores.horaFin = 'La hora de fin debe ser posterior al inicio.';
      }
    }

    setErrores(nuevosErrores);

    return !Object.values(nuevosErrores).some(Boolean);
  };

  const seleccionarFecha = (fecha) => {
    setFechaSeleccionada(fecha.value);
    setHoraInicio(null);
    setHoraFin(null);
    limpiarErrorCampo('fecha');
    limpiarErrorCampo('horaInicio');
    limpiarErrorCampo('horaFin');
  };

  const seleccionarHoraInicio = (hora) => {
    setHoraInicio(hora);
    limpiarErrorCampo('horaInicio');
    setModalHoraInicioVisible(false);

    if (horaFin && convertirMinutos(horaFin) <= convertirMinutos(hora)) {
      setHoraFin(null);
      limpiarErrorCampo('horaFin');
    }
  };

  const seleccionarHoraFin = (hora) => {
    if (!horaInicio) {
      setErrores((prev) => ({
        ...prev,
        horaInicio: 'Primero selecciona la hora de inicio.',
      }));
      return;
    }

    if (convertirMinutos(hora) <= convertirMinutos(horaInicio)) {
      setErrores((prev) => ({
        ...prev,
        horaFin: 'La hora de fin debe ser posterior al inicio.',
      }));
      return;
    }

    setHoraFin(hora);
    limpiarErrorCampo('horaFin');
    setModalHoraFinVisible(false);
  };

  const crearReserva = async () => {
    const formularioValido = validarFormularioReserva();

    if (!formularioValido) {
      return;
    }

    try {
      setGuardando(true);

      if (!API_URL) {
        throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
      }

      const tokenActual = await obtenerTokenActual();

      const bodyData = {
        espacio_id: espacioSeleccionado.id,
        materia,
        hora_inicio: construirFechaHoraLocal(fechaSeleccionada, horaInicio),
        hora_fin: construirFechaHoraLocal(fechaSeleccionada, horaFin),
      };

      const response = await fetch(`${API_URL}/api/v1/reservas/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenActual}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const data = await leerRespuestaSegura(response, {});

      if (!response.ok) {
        throw new Error(data?.detail || 'No se pudo crear la reserva.');
      }

      mostrarFeedback({
        tipo: 'success',
        titulo: 'Reserva creada',
        mensaje: 'El aula fue reservada correctamente.',
        accion: () => {
          limpiarFormulario();
          if (onBack) onBack();
        },
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
        limpiarErrorCampo('aula');
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

  const fechasDisponibles = generarFechas();
  const horasInicioDisponibles = generarHorasDisponibles();
  const horasFinDisponibles = generarHorasDisponibles({ paraFin: true });

  const fechaVisible = fechasDisponibles.find(
    (item) => item.value === fechaSeleccionada
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
            style={[styles.selectBox, errores.aula && styles.selectBoxError]}
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
                color={errores.aula ? '#DC2626' : colors.textSecondary}
              />
            )}
          </TouchableOpacity>

          {errores.aula ? (
            <Text style={styles.errorFieldText}>{errores.aula}</Text>
          ) : null}

          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={styles.inputLabelNoMargin}>Fecha</Text>
                <Text style={styles.helperText}>
                  Escoge el día viendo también la semana.
                </Text>
              </View>

              {fechaVisible && (
                <View style={styles.selectedMiniChip}>
                  <Text style={styles.selectedMiniChipText}>
                    {fechaVisible.textoCompleto}
                  </Text>
                </View>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateRow}
            >
              {fechasDisponibles.map((fecha) => {
                const active = fechaSeleccionada === fecha.value;

                return (
                  <TouchableOpacity
                    key={fecha.value}
                    style={[
                      styles.dateCard,
                      active && styles.dateCardActive,
                      errores.fecha && styles.dateCardError,
                    ]}
                    onPress={() => seleccionarFecha(fecha)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.dateDayText,
                        active && styles.dateTextActive,
                      ]}
                    >
                      {fecha.diaSemana}
                    </Text>

                    <Text
                      style={[
                        styles.dateNumberText,
                        active && styles.dateTextActive,
                      ]}
                    >
                      {fecha.diaNumero}
                    </Text>

                    <Text
                      style={[
                        styles.dateMonthText,
                        active && styles.dateTextActive,
                      ]}
                    >
                      {fecha.mes}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {errores.fecha ? (
              <Text style={styles.errorFieldText}>{errores.fecha}</Text>
            ) : null}
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.inputLabel}>Hora inicio</Text>

              <TouchableOpacity
                style={[
                  styles.selectBox,
                  errores.horaInicio && styles.selectBoxError,
                ]}
                onPress={() => {
                  if (!fechaSeleccionada) {
                    setErrores((prev) => ({
                      ...prev,
                      fecha: 'Primero selecciona la fecha.',
                    }));
                    return;
                  }

                  setModalHoraInicioVisible(true);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.selectTextBox}>
                  <Text
                    style={[
                      styles.selectText,
                      !horaInicio && styles.placeholderText,
                    ]}
                  >
                    {horaInicio || 'Inicio'}
                  </Text>
                </View>

                <Ionicons
                  name="time-outline"
                  size={20}
                  color={errores.horaInicio ? '#DC2626' : colors.textSecondary}
                />
              </TouchableOpacity>

              {errores.horaInicio ? (
                <Text style={styles.errorFieldText}>{errores.horaInicio}</Text>
              ) : null}
            </View>

            <View style={styles.timeColumn}>
              <Text style={styles.inputLabel}>Hora fin</Text>

              <TouchableOpacity
                style={[
                  styles.selectBox,
                  errores.horaFin && styles.selectBoxError,
                ]}
                onPress={() => {
                  if (!horaInicio) {
                    setErrores((prev) => ({
                      ...prev,
                      horaInicio: 'Primero selecciona la hora de inicio.',
                    }));
                    return;
                  }

                  setModalHoraFinVisible(true);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.selectTextBox}>
                  <Text
                    style={[
                      styles.selectText,
                      !horaFin && styles.placeholderText,
                    ]}
                  >
                    {horaFin || 'Fin'}
                  </Text>
                </View>

                <Ionicons
                  name="time-outline"
                  size={20}
                  color={errores.horaFin ? '#DC2626' : colors.textSecondary}
                />
              </TouchableOpacity>

              {errores.horaFin ? (
                <Text style={styles.errorFieldText}>{errores.horaFin}</Text>
              ) : null}
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
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={colors.white}
                />
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

      <TimeSelectorModal
        visible={modalHoraInicioVisible}
        title="Hora de inicio"
        subtitle="Solo se muestran horarios disponibles."
        data={horasInicioDisponibles}
        selected={horaInicio}
        onSelect={seleccionarHoraInicio}
        onClose={() => setModalHoraInicioVisible(false)}
      />

      <TimeSelectorModal
        visible={modalHoraFinVisible}
        title="Hora de fin"
        subtitle="Debe ser posterior a la hora de inicio."
        data={horasFinDisponibles}
        selected={horaFin}
        onSelect={seleccionarHoraFin}
        onClose={() => setModalHoraFinVisible(false)}
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

function TimeSelectorModal({
  visible,
  title,
  subtitle,
  data,
  selected,
  onSelect,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlayBottom}>
        <View style={styles.timeModalContent}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.timeModalSubtitle}>{subtitle}</Text>
            </View>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {data?.length > 0 ? (
            <View style={styles.timeModalGrid}>
              {data.map((hora) => {
                const active = selected === hora;

                return (
                  <TouchableOpacity
                    key={hora}
                    style={[
                      styles.timeModalChip,
                      active && styles.timeModalChipActive,
                    ]}
                    onPress={() => onSelect(hora)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.timeModalChipText,
                        active && styles.timeModalChipTextActive,
                      ]}
                    >
                      {hora}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyModal}>
              <Ionicons
                name="time-outline"
                size={34}
                color={colors.textMuted}
              />

              <Text style={styles.emptyModalText}>
                No hay horarios disponibles.
              </Text>
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
      label: 'Creado correctamente',
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
  const esSuccess = tipo === 'success';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={esSuccess ? undefined : onClose}
    >
      <View style={styles.feedbackOverlay}>
        <View style={styles.feedbackCard}>
          <View style={[styles.feedbackIconBox, { backgroundColor: item.bg }]}>
            <Ionicons name={item.icon} size={36} color={item.color} />
          </View>

          <Text style={styles.feedbackTitle}>{titulo}</Text>

          <Text style={styles.feedbackMessage}>{mensaje}</Text>

          {esSuccess ? (
            <View style={styles.successPill}>
              <ActivityIndicator size="small" color="#16A34A" />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.feedbackBtn, { backgroundColor: item.button }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.feedbackBtnText}>{item.label}</Text>
            </TouchableOpacity>
          )}
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

  inputLabelNoMargin: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  helperText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
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

  selectBoxError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
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

  errorFieldText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: typography.weight.bold,
    marginTop: -6,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },

  sectionBlock: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  sectionTitleRow: {
    marginBottom: spacing.sm,
  },

  selectedMiniChip: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  selectedMiniChipText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },

  dateRow: {
    paddingRight: spacing.lg,
  },

  dateCard: {
    width: 76,
    minHeight: 92,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  dateCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  dateCardError: {
    borderColor: '#FCA5A5',
  },

  dateDayText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
  },

  dateNumberText: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    marginTop: 4,
  },

  dateMonthText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    marginTop: 2,
  },

  dateTextActive: {
    color: colors.white,
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

  timeModalContent: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '62%',
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

  timeModalSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 3,
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

  timeModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  timeModalChip: {
    minWidth: 76,
    minHeight: 42,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },

  timeModalChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  timeModalChipText: {
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  timeModalChipTextActive: {
    color: colors.white,
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

  successPill: {
    minHeight: 42,
    borderRadius: radius.full,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  successPillText: {
    marginLeft: spacing.xs,
    fontSize: typography.size.xs,
    color: '#16A34A',
    fontWeight: typography.weight.bold,
  },
});