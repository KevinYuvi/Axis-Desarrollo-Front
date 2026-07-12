import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import { AppHeader } from '../../../../shared/components';

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const preguntasRapidas = [
  '¿Qué biblioteca tiene más espacio disponible ahora?',
  '¿Dónde queda el Laboratorio de Computación 3?',
  '¿Tengo una clase activa en este momento?',
  'El proyector del Laboratorio 3 no enciende.',
];

export default function AsistenteIAScreen({ token, onBack, rol }) {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const timerRef = useRef(null);
  const flatListRef = useRef(null);

  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [segundosGrabando, setSegundosGrabando] = useState(0);
  const [audioUri, setAudioUri] = useState(null);
  const [mostrarRapidas, setMostrarRapidas] = useState(false);

  const [mensajes, setMensajes] = useState([
    {
      id: 'inicio',
      tipo: 'ia',
      texto:
        'Hola, soy tu asistente de Axis. Puedes escribirme o enviarme un audio.',
    },
  ]);

  useEffect(() => {
    prepararAudio();

    return () => {
      limpiarTemporizador();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [mensajes, enviando]);

  const prepararAudio = async () => {
    try {
      const permiso = await AudioModule.requestRecordingPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          'Permiso requerido',
          'Debes permitir el acceso al micrófono para grabar audios.'
        );
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    } catch (error) {
      console.error('Error preparando audio:', error);
      Alert.alert('Error', 'No se pudo preparar el micrófono.');
    }
  };

  const limpiarTemporizador = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const iniciarGrabacion = async () => {
    try {
      setTexto('');
      setAudioUri(null);
      setSegundosGrabando(0);

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      timerRef.current = setInterval(() => {
        setSegundosGrabando((prev) => {
          const nuevoValor = prev + 1;

          if (nuevoValor >= 60) {
            detenerGrabacion(false);
            return 60;
          }

          return nuevoValor;
        });
      }, 1000);
    } catch (error) {
      console.error('Error iniciando grabación:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación.');
    }
  };

  const detenerGrabacion = async () => {
    try {
      limpiarTemporizador();

      await audioRecorder.stop();

      const uri = audioRecorder.uri;

      if (!uri) {
        Alert.alert('Audio no disponible', 'No se pudo obtener el audio grabado.');
        return;
      }

      setAudioUri(uri);
    } catch (error) {
      console.error('Error deteniendo grabación:', error);
      Alert.alert('Error', 'No se pudo detener la grabación.');
    }
  };

  const cancelarAudio = () => {
    setAudioUri(null);
    setSegundosGrabando(0);
  };

  const formatearTiempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;

    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const agregarMensaje = (mensaje) => {
    setMensajes((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        ...mensaje,
      },
    ]);
  };

  const enviarDesdeInput = async () => {
    if (enviando) return;

    if (audioUri) {
      const uriEnviar = audioUri;
      const duracionEnviar = segundosGrabando;

      setAudioUri(null);
      setSegundosGrabando(0);

      await enviarSolicitud('', uriEnviar, duracionEnviar);
      return;
    }

    if (!texto.trim()) return;

    const textoEnviar = texto.trim();

    setTexto('');
    await enviarSolicitud(textoEnviar, null, null);
  };

  const enviarPreguntaRapida = async (pregunta) => {
    setMostrarRapidas(false);
    await enviarSolicitud(pregunta, null, null);
  };

  const enviarSolicitud = async (
    textoEnviar = '',
    uriAudio = null,
    duracion = null
  ) => {
    try {
      setEnviando(true);

      if (!API_URL) {
        throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
      }

      if (!token) {
        throw new Error('No se encontró el token de sesión.');
      }

      if (textoEnviar) {
        agregarMensaje({
          tipo: 'usuario',
          texto: textoEnviar,
        });
      }

      if (uriAudio) {
        const duracionMostrada = duracion || segundosGrabando || 0;

        agregarMensaje({
          tipo: 'usuario',
          texto: `Audio (${formatearTiempo(duracionMostrada)})`,
          esAudio: true,
        });
      }

      const formData = new FormData();

      if (textoEnviar) {
        formData.append('texto_chat', textoEnviar);
      }

      if (uriAudio) {
        const nombreArchivo =
          Platform.OS === 'web' ? 'audio_axis.webm' : 'audio_axis.m4a';

        const tipoArchivo = Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a';

        formData.append('file', {
          uri: uriAudio,
          name: nombreArchivo,
          type: tipoArchivo,
        });

        formData.append('duracion_segundos', String(duracion || 0));
      }

      const response = await fetch(`${API_URL}/api/v1/ia/procesar-solicitud`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || 'No se pudo procesar la solicitud.');
      }

      agregarMensaje({
        tipo: 'ia',
        texto: data?.respuesta_app || 'Listo, procesé tu solicitud.',
        detalle: data,
      });
    } catch (error) {
      console.error('Error enviando solicitud IA:', error);

      agregarMensaje({
        tipo: 'ia',
        texto: error.message || 'No se pudo procesar la solicitud.',
        error: true,
      });
    } finally {
      setEnviando(false);
    }
  };

  const renderMensaje = ({ item }) => {
    const esUsuario = item.tipo === 'usuario';

    return (
      <View
        style={[
          styles.messageRow,
          esUsuario ? styles.messageRowUser : styles.messageRowIA,
        ]}
      >
        {!esUsuario && (
          <View style={styles.botAvatar}>
            <Ionicons name="hardware-chip-outline" size={18} color="#FFFFFF" />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            esUsuario ? styles.userBubble : styles.iaBubble,
            item.error && styles.errorBubble,
          ]}
        >
          {item.esAudio ? (
            <View style={styles.audioMessageRow}>
              <Ionicons
                name="mic-outline"
                size={16}
                color={esUsuario ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.messageText,
                  esUsuario ? styles.userText : styles.iaText,
                ]}
              >
                {item.texto}
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.messageText,
                esUsuario ? styles.userText : styles.iaText,
              ]}
            >
              {item.texto}
            </Text>
          )}

          {item.detalle?.aula_identificada && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>
                {item.detalle.aula_identificada}
              </Text>

              {item.detalle.accion && (
                <Text style={styles.resultSub}>
                  Acción: {item.detalle.accion}
                </Text>
              )}

              {item.detalle.status && (
                <View style={styles.statusMiniBadge}>
                  <Text style={styles.statusMiniText}>
                    {item.detalle.status}
                  </Text>
                </View>
              )}
            </View>
          )}

          {item.detalle?.status === 'pendiente_confirmacion' &&
            item.detalle?.accion === 'RESERVA' && (
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.confirmYesBtn}
                  onPress={() => enviarSolicitud('Sí, confirma', null, null)}
                  disabled={enviando}
                >
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  <Text style={styles.confirmYesText}>Sí</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmNoBtn}
                  onPress={() => enviarSolicitud('No, cancelar', null, null)}
                  disabled={enviando}
                >
                  <Ionicons name="close" size={16} color="#DC2626" />
                  <Text style={styles.confirmNoText}>No</Text>
                </TouchableOpacity>
              </View>
            )}
        </View>
      </View>
    );
  };

  const renderTyping = () => {
    if (!enviando) return null;

    return (
      <View style={[styles.messageRow, styles.messageRowIA]}>
        <View style={styles.botAvatar}>
          <Ionicons name="hardware-chip-outline" size={18} color={colors.white} />
        </View>

        <View style={[styles.messageBubble, styles.iaBubble, styles.typingBubble]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.typingText}>Procesando...</Text>
        </View>
      </View>
    );
  };

  const puedeEnviar =
    !enviando &&
    !recorderState.isRecording &&
    (texto.trim().length > 0 || Boolean(audioUri));

  const renderInputPrincipal = () => {
    if (recorderState.isRecording) {
      return (
        <View style={styles.audioInputCard}>
          <View style={styles.recordingInfo}>
            <View style={styles.recordingDot} />

            <View style={styles.audioInfoTextBox}>
              <Text style={styles.audioTitle}>Grabando audio</Text>
              <Text style={styles.audioSubtitle}>
                {formatearTiempo(segundosGrabando)} / 01:00
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (audioUri) {
      return (
        <View style={styles.audioInputCard}>
          <View style={styles.audioReadyIcon}>
            <Ionicons name="mic-outline" size={18} color={colors.primary} />
          </View>

          <View style={styles.audioInfoTextBox}>
            <Text style={styles.audioTitle}>Audio listo</Text>
            <Text style={styles.audioSubtitle}>
              {formatearTiempo(segundosGrabando)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.clearAudioBtn}
            onPress={cancelarAudio}
            disabled={enviando}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TextInput
        style={styles.input}
        placeholder="Escribe tu consulta..."
        placeholderTextColor={colors.textMuted}
        value={texto}
        onChangeText={setTexto}
        multiline
        editable={!enviando}
      />
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {onBack ? (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            accessibilityLabel="Volver"
          >
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.headerBrand}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="hardware-chip-outline"
                size={17}
                color={colors.white}
              />
            </View>

            <Text style={styles.headerTitle}>Asistente IA</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      ) : (
        <AppHeader rol={rol || 'estudiante'} />
      )}

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item) => item.id}
          renderItem={renderMensaje}
          ListFooterComponent={renderTyping}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        {mostrarRapidas && (
          <View style={styles.quickPanel}>
            <View style={styles.quickHeader}>
              <Text style={styles.quickTitle}>Preguntas rápidas</Text>

              <TouchableOpacity onPress={() => setMostrarRapidas(false)}>
                <Ionicons
                  name="close"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={preguntasRapidas}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.quickChip}
                  onPress={() => enviarPreguntaRapida(item)}
                  disabled={enviando}
                >
                  <Text style={styles.quickChipText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <View style={styles.inputArea}>
          <TouchableOpacity
            style={[
              styles.roundBtn,
              styles.quickBtn,
              mostrarRapidas && styles.quickBtnActive,
            ]}
            onPress={() => setMostrarRapidas((prev) => !prev)}
            disabled={enviando || recorderState.isRecording}
          >
            <Ionicons
              name="flash-outline"
              size={21}
              color={mostrarRapidas ? colors.white : colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roundBtn,
              styles.micBtn,
              recorderState.isRecording && styles.micBtnRecording,
            ]}
            onPress={
              recorderState.isRecording ? detenerGrabacion : iniciarGrabacion
            }
            disabled={enviando || Boolean(audioUri)}
          >
            <Ionicons
              name={recorderState.isRecording ? 'stop' : 'mic-outline'}
              size={22}
              color={colors.white}
            />
          </TouchableOpacity>

          <View style={styles.inputCenter}>{renderInputPrincipal()}</View>

          <TouchableOpacity
            style={[
              styles.roundBtn,
              styles.sendBtn,
              !puedeEnviar && styles.sendBtnDisabled,
            ]}
            onPress={enviarDesdeInput}
            disabled={!puedeEnviar}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  headerBrand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  headerSpacer: {
    width: 38,
  },

  body: {
    flex: 1,
    backgroundColor: colors.background,
  },

  messagesContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },

  messageRowIA: {
    justifyContent: 'flex-start',
  },

  messageRowUser: {
    justifyContent: 'flex-end',
  },

  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },

  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  iaBubble: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  userBubble: {
    backgroundColor: colors.primary,
  },

  errorBubble: {
    borderColor: '#FCA5A5',
    backgroundColor: colors.dangerBg,
  },

  messageText: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },

  iaText: {
    color: colors.textPrimary,
  },

  userText: {
    color: colors.white,
  },

  audioMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  typingText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    marginLeft: spacing.sm,
  },

  resultCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },

  resultTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  resultSub: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 3,
  },

  statusMiniBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },

  statusMiniText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: typography.weight.bold,
  },

  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  confirmYesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  confirmYesText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    marginLeft: 5,
  },

  confirmNoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  confirmNoText: {
    color: colors.danger,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    marginLeft: 5,
  },

  quickPanel: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },

  quickHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  quickTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  quickList: {
    paddingHorizontal: spacing.lg,
  },

  quickChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    maxWidth: 260,
  },

  quickChipText: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  inputArea: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },

  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },

  quickBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  micBtn: {
    backgroundColor: colors.primary,
  },

  micBtnRecording: {
    backgroundColor: colors.danger,
  },

  sendBtn: {
    backgroundColor: colors.primary,
  },

  sendBtnDisabled: {
    opacity: 0.35,
  },

  inputCenter: {
    flex: 1,
  },

  input: {
    minHeight: 44,
    maxHeight: 92,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },

  audioInputCard: {
    minHeight: 44,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  recordingDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.danger,
    marginRight: spacing.sm,
  },

  audioReadyIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  audioInfoTextBox: {
    flex: 1,
  },

  audioTitle: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  audioSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
    fontWeight: typography.weight.semibold,
  },

  clearAudioBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});