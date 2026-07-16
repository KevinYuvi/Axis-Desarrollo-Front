import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const CLERK_JWT_TEMPLATE = 'Axis';

const PRIORIDADES = [
  {
    value: 'baja',
    label: 'Baja',
    icon: 'chevron-down-circle-outline',
    bg: '#F0FDF4',
    color: '#16A34A',
  },
  {
    value: 'media',
    label: 'Media',
    icon: 'remove-circle-outline',
    bg: '#EFF6FF',
    color: colors.primary,
  },
  {
    value: 'alta',
    label: 'Alta',
    icon: 'alert-circle-outline',
    bg: '#FEE2E2',
    color: colors.danger,
  },
];

export default function ReportarIncidenciaScreen({ token, claseActual, onBack }) {
  const { getToken } = useAuth();

  const [prioridad, setPrioridad] = useState('media');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTipo, setModalTipo] = useState('info');
  const [modalTitulo, setModalTitulo] = useState('');
  const [modalMensaje, setModalMensaje] = useState('');
  const [modalAccion, setModalAccion] = useState(null);

  const espacioId =
    claseActual?.espacio?.id ||
    claseActual?.espacio?._id ||
    claseActual?.espacio_id ||
    claseActual?.reserva?.espacio_id ||
    '';

  const aulaNombre =
    claseActual?.espacio?.nombre ||
    claseActual?.espacio_nombre ||
    claseActual?.reserva?.espacio_nombre ||
    'Aula no identificada';

  const aulaBloque =
    claseActual?.espacio?.bloque ||
    claseActual?.bloque ||
    'Sin bloque';

  const materia =
    claseActual?.reserva?.materia ||
    claseActual?.materia ||
    'Clase actual';

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
      return {
        detail: rawText,
      };
    }
  };

  const convertirErrorAtexto = (errorData) => {
    if (!errorData) {
      return 'No se pudo generar el reporte.';
    }

    if (typeof errorData === 'string') {
      return errorData;
    }

    if (Array.isArray(errorData)) {
      return errorData
        .map((item) => convertirErrorAtexto(item))
        .filter(Boolean)
        .join('\n');
    }

    if (typeof errorData === 'object') {
      if (errorData.msg) {
        const campo = Array.isArray(errorData.loc)
          ? errorData.loc.filter((item) => item !== 'body').join(' > ')
          : '';

        return campo ? `${campo}: ${errorData.msg}` : errorData.msg;
      }

      if (errorData.message) {
        return convertirErrorAtexto(errorData.message);
      }

      if (errorData.detail) {
        return convertirErrorAtexto(errorData.detail);
      }

      if (errorData.error) {
        return convertirErrorAtexto(errorData.error);
      }

      try {
        return JSON.stringify(errorData, null, 2);
      } catch {
        return 'No se pudo generar el reporte.';
      }
    }

    return String(errorData);
  };

  const mostrarModal = ({ tipo = 'info', titulo, mensaje, accion = null }) => {
    setModalTipo(tipo);
    setModalTitulo(titulo);
    setModalMensaje(mensaje);
    setModalAccion(() => accion);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);

    if (modalAccion) {
      modalAccion();
    }

    setModalAccion(null);
  };

  const validarFormulario = () => {
    if (!API_URL) {
      mostrarModal({
        tipo: 'error',
        titulo: 'Error',
        mensaje: 'Falta EXPO_PUBLIC_API_URL en el archivo .env.',
      });
      return false;
    }

    if (!espacioId) {
      mostrarModal({
        tipo: 'warning',
        titulo: 'Sin aula',
        mensaje:
          'No se pudo identificar el aula afectada. Vuelve al inicio y entra nuevamente a la clase actual.',
      });
      return false;
    }

    if (!descripcion.trim()) {
      mostrarModal({
        tipo: 'warning',
        titulo: 'Campo requerido',
        mensaje: 'Describe brevemente el problema encontrado.',
      });
      return false;
    }

    if (descripcion.trim().length < 10) {
      mostrarModal({
        tipo: 'warning',
        titulo: 'Descripción muy corta',
        mensaje: 'La descripción debe tener al menos 10 caracteres.',
      });
      return false;
    }

    return true;
  };

  const enviarReporte = async () => {
    const formularioValido = validarFormulario();

    if (!formularioValido) {
      return;
    }

    try {
      setEnviando(true);

      const tokenActual = await obtenerTokenActual();

      const payload = {
        espacio_id: espacioId,
        descripcion: descripcion.trim(),
        gravedad: prioridad,
      };

      console.log('PAYLOAD REPORTE:', payload);

      const response = await fetch(`${API_URL}/api/v1/reportes/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenActual}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await leerRespuestaSegura(response, {});

      if (!response.ok) {
        console.log('ERROR BACKEND REPORTE:', data);

        const mensajeError = convertirErrorAtexto(data);

        throw new Error(mensajeError || 'No se pudo generar el reporte.');
      }

      mostrarModal({
        tipo: 'success',
        titulo: 'Reporte generado',
        mensaje: 'Tu reporte fue registrado correctamente.',
        accion: () => {
          setPrioridad('media');
          setDescripcion('');

          if (onBack) {
            onBack();
          }
        },
      });
    } catch (error) {
      console.error('Error generando reporte:', error);

      mostrarModal({
        tipo: 'error',
        titulo: 'No se pudo generar',
        mensaje: error.message || 'No se pudo generar el reporte.',
      });
    } finally {
      setEnviando(false);
    }
  };

  const prioridadSeleccionada =
    PRIORIDADES.find((item) => item.value === prioridad) || PRIORIDADES[1];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Reportar incidencia</Text>
          <Text style={styles.headerSubtitle}>Clase en curso</Text>
        </View>

        <View style={styles.headerIconBox}>
          <Ionicons
            name="alert-circle-outline"
            size={19}
            color={colors.primary}
          />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contextCard}>
            <View style={styles.contextIcon}>
              <Ionicons
                name="business-outline"
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.contextTextBox}>
              <Text style={styles.contextTitle} numberOfLines={1}>
                {aulaNombre}
              </Text>

              <Text style={styles.contextSubtitle} numberOfLines={1}>
                {aulaBloque} · {materia}
              </Text>

              {!espacioId ? (
                <Text style={styles.contextWarning} numberOfLines={2}>
                  No se detectó el ID del aula.
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Detalles del problema</Text>
                <Text style={styles.cardSubtitle}>
                  Selecciona la gravedad y describe lo ocurrido.
                </Text>
              </View>

              <View
                style={[
                  styles.priorityMiniBadge,
                  {
                    backgroundColor: prioridadSeleccionada.bg,
                  },
                ]}
              >
                <Ionicons
                  name={prioridadSeleccionada.icon}
                  size={14}
                  color={prioridadSeleccionada.color}
                />

                <Text
                  style={[
                    styles.priorityMiniText,
                    {
                      color: prioridadSeleccionada.color,
                    },
                  ]}
                >
                  {prioridadSeleccionada.label}
                </Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Gravedad</Text>

            <View style={styles.priorityRow}>
              {PRIORIDADES.map((item) => {
                const active = prioridad === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.priorityBtn,
                      active && {
                        backgroundColor: item.bg,
                        borderColor: item.color,
                      },
                    ]}
                    onPress={() => setPrioridad(item.value)}
                    disabled={enviando}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={active ? item.color : colors.textSecondary}
                    />

                    <Text
                      style={[
                        styles.priorityText,
                        active && {
                          color: item.color,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Descripción</Text>

            <TextInput
              style={styles.textArea}
              placeholder="Ejemplo: el proyector no enciende, falta un cable, el equipo no responde..."
              placeholderTextColor={colors.textMuted}
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              textAlignVertical="top"
              editable={!enviando}
              maxLength={500}
            />

            <Text style={styles.counterText}>
              {descripcion.trim().length}/500 caracteres
            </Text>

            <TouchableOpacity
              style={[styles.submitBtn, enviando && styles.disabledBtn]}
              onPress={enviarReporte}
              disabled={enviando}
              accessibilityRole="button"
              activeOpacity={0.85}
            >
              {enviando ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Enviar reporte</Text>
                  <Ionicons
                    name="send-outline"
                    size={17}
                    color={colors.white}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <FeedbackModal
        visible={modalVisible}
        tipo={modalTipo}
        titulo={modalTitulo}
        mensaje={modalMensaje}
        onClose={cerrarModal}
      />
    </SafeAreaView>
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={[styles.modalIconBox, { backgroundColor: item.bg }]}>
            <Ionicons name={item.icon} size={32} color={item.color} />
          </View>

          <Text style={styles.modalTitle}>{titulo}</Text>

          <Text style={styles.modalMessage}>{mensaje}</Text>

          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: item.button }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.modalBtnText}>{item.label}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },

  flex: {
    flex: 1,
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

  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollInner: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  contextCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  contextIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  contextTextBox: {
    flex: 1,
  },

  contextTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  contextSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 3,
  },

  contextWarning: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: typography.weight.bold,
    marginTop: 5,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },

  cardHeaderText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  cardSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },

  priorityMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },

  priorityMiniText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },

  inputLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },

  priorityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  priorityBtn: {
    flex: 1,
    minHeight: 54,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  priorityText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.textSecondary,
  },

  textArea: {
    minHeight: 135,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  counterText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: spacing.md,
    fontWeight: typography.weight.semibold,
  },

  submitBtn: {
    minHeight: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  modalIconBox: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  modalMessage: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  modalBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
});