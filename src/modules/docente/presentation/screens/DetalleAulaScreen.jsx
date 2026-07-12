import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DetalleAulaScreen({
  token,
  claseActual,
  onBack,
  onReportar,
}) {
  const [liberando, setLiberando] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTipo, setModalTipo] = useState('info');
  const [modalTitulo, setModalTitulo] = useState('');
  const [modalMensaje, setModalMensaje] = useState('');
  const [modalAccion, setModalAccion] = useState(null);
  const [modalConfirmacion, setModalConfirmacion] = useState(false);

  const espacio = claseActual?.espacio || {};
  const reserva = claseActual?.reserva || {};

  const equipamiento = Array.isArray(espacio?.equipamiento)
    ? espacio.equipamiento
    : [];

  const convertirFecha = (fechaTexto) => {
    if (!fechaTexto) return null;

    const fecha = new Date(fechaTexto);

    return Number.isNaN(fecha.getTime()) ? null : fecha;
  };

const obtenerEstadoClase = () => {
  const inicio = convertirFecha(reserva?.hora_inicio);
  const fin = convertirFecha(reserva?.hora_fin);

  if (
    reserva?.liberada_anticipadamente === true ||
    reserva?.estado === 'liberada' ||
    reserva?.estado === 'cancelada'
  ) {
    return 'liberada';
  }

  if (!inicio || !fin) {
    return 'sin_horario';
  }

  const ahora = new Date();

  if (fin <= ahora) {
    return 'finalizada';
  }

  if (fin <= inicio) {
    return 'liberada';
  }

  if (ahora >= inicio && ahora <= fin) {
    return 'en_curso';
  }

  if (ahora < inicio) {
    return 'futura';
  }

  return 'finalizada';
};
  const formatHorario = (isoInicio, isoFin) => {
    if (!isoInicio || !isoFin) return 'N/A';

    const inicio = convertirFecha(isoInicio);
    const fin = convertirFecha(isoFin);

    if (!inicio || !fin) return 'N/A';

    const opciones = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    return `${inicio.toLocaleTimeString([], opciones)} – ${fin.toLocaleTimeString(
      [],
      opciones
    )}`;
  };

  const normalizarTexto = (texto) => {
    if (!texto) return 'No registrado';

    return String(texto)
      .replace('_', ' ')
      .replace(/\b\w/g, (letra) => letra.toUpperCase());
  };

  const mostrarModal = ({
    tipo = 'info',
    titulo,
    mensaje,
    accion = null,
    confirmacion = false,
  }) => {
    setModalTipo(tipo);
    setModalTitulo(titulo);
    setModalMensaje(mensaje);
    setModalAccion(() => accion);
    setModalConfirmacion(confirmacion);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);

    if (!modalConfirmacion && modalAccion) {
      modalAccion();
    }

    setModalAccion(null);
    setModalConfirmacion(false);
  };

  const confirmarModal = () => {
    setModalVisible(false);

    if (modalAccion) {
      modalAccion();
    }

    setModalAccion(null);
    setModalConfirmacion(false);
  };

  const liberarAula = () => {
    const estadoClase = obtenerEstadoClase();

    if (!reserva?.id) {
      mostrarModal({
        tipo: 'warning',
        titulo: 'Sin reserva',
        mensaje: 'No se pudo identificar la reserva seleccionada.',
      });
      return;
    }

    if (estadoClase === 'finalizada') {
      mostrarModal({
        tipo: 'warning',
        titulo: 'No disponible',
        mensaje: 'No puedes liberar una clase que ya finalizó.',
      });
      return;
    }

    if (estadoClase === 'sin_horario') {
      mostrarModal({
        tipo: 'warning',
        titulo: 'Horario no válido',
        mensaje: 'No se pudo validar el horario de esta reserva.',
      });
      return;
    }

    mostrarModal({
      tipo: 'danger',
      titulo: estadoClase === 'futura' ? 'Liberar reserva' : 'Liberar aula',
      mensaje:
        estadoClase === 'futura'
          ? '¿Seguro que deseas liberar esta aula reservada para una clase futura?'
          : '¿Seguro que deseas liberar esta aula anticipadamente?',
      confirmacion: true,
      accion: confirmarLiberarAula,
    });
  };

  const confirmarLiberarAula = async () => {
    try {
      setLiberando(true);

      if (!API_URL) {
        throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
      }

      if (!token) {
        throw new Error('No se encontró el token de sesión.');
      }

      const estadoClase = obtenerEstadoClase();

      const endpoint =
        estadoClase === 'en_curso'
          ? `${API_URL}/api/v1/reservas/liberar-actual`
          : `${API_URL}/api/v1/reservas/${reserva.id}/liberar`;

const response = await fetch(endpoint, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  },
});

const rawText = await response.text();

let data = {};

if (rawText) {
  try {
    data = JSON.parse(rawText);
  } catch {
    data = {};
  }
}

if (!response.ok) {
  throw new Error(data?.detail || 'No se pudo liberar el aula.');
}

      mostrarModal({
        tipo: 'success',
        titulo: 'Aula liberada',
        mensaje: data?.message || 'El aula fue liberada correctamente.',
        accion: onBack,
      });
    } catch (error) {
      console.error('Error liberando aula:', error);

      mostrarModal({
        tipo: 'error',
        titulo: 'Error',
        mensaje: error.message || 'No se pudo liberar el aula.',
      });
    } finally {
      setLiberando(false);
    }
  };

  const estadoClase = obtenerEstadoClase();

  const estadoConfig = {
    en_curso: {
      label: 'En curso',
      bg: '#DCFCE7',
      color: '#16A34A',
      icon: 'checkmark-circle-outline',
    },
    futura: {
      label: 'Próxima',
      bg: '#EFF6FF',
      color: colors.primary,
      icon: 'time-outline',
    },
    finalizada: {
      label: 'Finalizada',
      bg: '#F3F4F6',
      color: '#6B7280',
      icon: 'checkmark-done-outline',
    },
    sin_horario: {
      label: 'Sin horario',
      bg: '#FEF3C7',
      color: '#D97706',
      icon: 'warning-outline',
    },liberada: {
  label: 'Liberada',
  bg: '#FEF2F2',
  color: '#DC2626',
  icon: 'exit-outline',
},
  };

  const estadoActual = estadoConfig[estadoClase] || estadoConfig.sin_horario;
  const puedeLiberar = estadoClase === 'en_curso' || estadoClase === 'futura';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Aula asignada</Text>
          <Text style={styles.headerSubtitle}>Detalle de clase</Text>
        </View>

        <View style={styles.headerIconBox}>
          <Ionicons name="business-outline" size={19} color={colors.primary} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.aulaIconBox}>
              <Ionicons name="business-outline" size={28} color={colors.primary} />
            </View>

            <View style={styles.heroTextBox}>
              <Text style={styles.aulaTitle} numberOfLines={2}>
                {espacio?.nombre || 'Aula asignada'}
              </Text>

              <Text style={styles.aulaSub} numberOfLines={1}>
                {espacio?.ubicacion || espacio?.bloque || 'Ubicación no registrada'}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: estadoActual.bg }]}>
            <Ionicons
              name={estadoActual.icon}
              size={14}
              color={estadoActual.color}
            />

            <Text style={[styles.statusText, { color: estadoActual.color }]}>
              {estadoActual.label}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Clase</Text>

          <InfoRow
            icon="book-outline"
            label="Materia"
            value={reserva?.materia || 'Sin materia'}
          />

          <InfoRow
            icon="time-outline"
            label="Horario"
            value={formatHorario(reserva?.hora_inicio, reserva?.hora_fin)}
          />

          <InfoRow
            icon="person-outline"
            label="Docente"
            value={reserva?.docente_nombre || 'No registrado'}
            noBorder
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Características del aula</Text>

          <View style={styles.featureGrid}>
            <FeatureItem
              icon="people-outline"
              label="Capacidad"
              value={espacio?.capacidad ? `${espacio.capacidad} personas` : 'No registrada'}
            />

            <FeatureItem
              icon="layers-outline"
              label="Bloque"
              value={espacio?.bloque || 'No registrado'}
            />

            <FeatureItem
              icon="cube-outline"
              label="Tipo"
              value={normalizarTexto(espacio?.tipo)}
            />

            <FeatureItem
              icon="radio-button-on-outline"
              label="Estado físico"
              value={normalizarTexto(espacio?.estado_actual || 'ocupado')}
            />
          </View>

          <View style={styles.equipmentBlock}>
            <View style={styles.equipmentHeader}>
              <View style={styles.equipmentHeaderLeft}>
                <Ionicons
                  name="construct-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text style={styles.equipmentTitle}>Equipamiento</Text>
              </View>

              <Text style={styles.equipmentCounter}>
                {equipamiento.length}
              </Text>
            </View>

            {equipamiento.length > 0 ? (
              <View style={styles.equipmentGrid}>
                {equipamiento.map((item, index) => (
                  <View key={`${item}-${index}`} style={styles.equipmentChip}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={15}
                      color="#16A34A"
                    />

                    <Text style={styles.equipmentText} numberOfLines={1}>
                      {normalizarTexto(item)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyEquipmentText}>
                No hay equipamiento registrado.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionsCard}>
          {puedeLiberar && (
            <TouchableOpacity
              style={[styles.releaseBtn, liberando && styles.disabledBtn]}
              onPress={liberarAula}
              disabled={liberando}
              activeOpacity={0.85}
            >
              {liberando ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <>
                  <View style={styles.releaseIconBox}>
                    <Ionicons
                      name="exit-outline"
                      size={18}
                      color={colors.textPrimary}
                    />
                  </View>

                  <View style={styles.actionTextBox}>
                    <Text style={styles.releaseBtnText}>Liberar aula</Text>
                    <Text style={styles.actionSubText}>
                      {estadoClase === 'futura'
                        ? 'Liberar esta reserva futura.'
                        : 'Marcar esta aula como disponible.'}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textSecondary}
                  />
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.reportBtn}
            onPress={onReportar}
            activeOpacity={0.85}
          >
            <View style={styles.reportIconBox}>
              <Ionicons name="warning-outline" size={18} color="#92400E" />
            </View>

            <View style={styles.actionTextBox}>
              <Text style={styles.reportBtnText}>Reportar incidencia</Text>
              <Text style={styles.reportSubText}>
                Registrar un problema en esta aula.
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#92400E" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FeedbackModal
        visible={modalVisible}
        tipo={modalTipo}
        titulo={modalTitulo}
        mensaje={modalMensaje}
        confirmacion={modalConfirmacion}
        onClose={cerrarModal}
        onConfirm={confirmarModal}
      />
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, noBorder }) {
  return (
    <View style={[styles.infoRow, noBorder && styles.infoRowNoBorder]}>
      <View style={styles.infoLeft}>
        <View style={styles.infoIconBox}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>

        <Text style={styles.infoLabel}>{label}</Text>
      </View>

      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function FeatureItem({ icon, label, value }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconBox}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>

      <View style={styles.featureTextBox}>
        <Text style={styles.featureLabel}>{label}</Text>
        <Text style={styles.featureValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function FeedbackModal({
  visible,
  tipo,
  titulo,
  mensaje,
  confirmacion,
  onClose,
  onConfirm,
}) {
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
      label: 'Continuar',
    },
    danger: {
      icon: 'alert-circle-outline',
      color: '#DC2626',
      bg: '#FEF2F2',
      button: '#DC2626',
      label: 'Liberar',
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

          {confirmacion ? (
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: item.button }]}
                onPress={onConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmText}>{item.label}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.modalSingleBtn, { backgroundColor: item.button }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.modalSingleText}>{item.label}</Text>
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  heroCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  aulaIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  heroTextBox: {
    flex: 1,
  },

  aulaTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  aulaSub: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  statusText: {
    fontSize: 13,
    fontWeight: typography.weight.bold,
  },

  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  infoRowNoBorder: {
    borderBottomWidth: 0,
  },

  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.sm,
  },

  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  infoLabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },

  infoValue: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'right',
  },

  featureGrid: {
    gap: spacing.sm,
  },

  featureItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },

  featureIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  featureTextBox: {
    flex: 1,
  },

  featureLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
  },

  featureValue: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
    marginTop: 2,
  },

  equipmentBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  equipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  equipmentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  equipmentTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  equipmentCounter: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    color: colors.primary,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },

  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  equipmentChip: {
    maxWidth: '100%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  equipmentText: {
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  emptyEquipmentText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  actionsCard: {
    gap: spacing.sm,
  },

  releaseBtn: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
  },

  releaseIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  releaseBtnText: {
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },

  actionTextBox: {
    flex: 1,
  },

  actionSubText: {
    color: colors.textSecondary,
    fontSize: typography.size.xs,
    marginTop: 2,
  },

  reportBtn: {
    backgroundColor: '#FEF3C7',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F59E0B',
    padding: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
  },

  reportIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  reportBtnText: {
    color: '#92400E',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },

  reportSubText: {
    color: '#92400E',
    fontSize: typography.size.xs,
    marginTop: 2,
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

  modalActions: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.sm,
  },

  modalCancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCancelText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  modalConfirmBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalConfirmText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },

  modalSingleBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalSingleText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
});