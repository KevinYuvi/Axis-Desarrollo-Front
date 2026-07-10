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

export default function AsistenteIAScreen({ token, onBack, onVerReportes, rol }) {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const timerRef = useRef(null);
  const flatListRef = useRef(null);

  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [segundosGrabando, setSegundosGrabando] = useState(0);
  const [audioUri, setAudioUri] = useState(null);

  const [mensajes, setMensajes] = useState([
    {
      id: 'inicio',
      tipo: 'ia',
      texto:
        'Hola, soy tu asistente de Axis. Puedes escribirme o enviarme un audio de máximo 1 minuto.',
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
      setAudioUri(null);
      setSegundosGrabando(0);

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      timerRef.current = setInterval(() => {
        setSegundosGrabando((prev) => {
          const nuevoValor = prev + 1;

          if (nuevoValor >= 60) {
            detenerGrabacion(true);
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

  const detenerGrabacion = async (autoEnviar = false) => {
    try {
      limpiarTemporizador();

      await audioRecorder.stop();

      const uri = audioRecorder.uri;

      if (!uri) {
        Alert.alert('Audio no disponible', 'No se pudo obtener el audio grabado.');
        return;
      }

      if (autoEnviar) {
        await enviarSolicitud('', uri, 60);
        return;
      }

      setAudioUri(uri);
    } catch (error) {
      console.error('Error deteniendo grabación:', error);
      Alert.alert('Error', 'No se pudo detener la grabación.');
    }
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

  const enviarTexto = async () => {
    if (!texto.trim()) return;

    const textoEnviar = texto.trim();

    setTexto('');
    await enviarSolicitud(textoEnviar, null, null);
  };

  const enviarAudioManual = async () => {
    if (!audioUri) {
      Alert.alert('Sin audio', 'Primero graba un audio.');
      return;
    }

    const uriEnviar = audioUri;
    const duracionEnviar = segundosGrabando;

    setAudioUri(null);
    setSegundosGrabando(0);

    await enviarSolicitud('', uriEnviar, duracionEnviar);
  };

  const enviarPreguntaRapida = async (pregunta) => {
    await enviarSolicitud(pregunta, null, null);
  };

  const enviarSolicitud = async (textoEnviar = '', uriAudio = null, duracion = null) => {
    try {
      setEnviando(true);

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
          texto: `Audio enviado (${formatearTiempo(duracionMostrada)})`,
          esAudio: true,
        });

        setAudioUri(null);
        setSegundosGrabando(0);
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

        formData.append('duracion_segundos', String(duracion || segundosGrabando || 0));
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
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            esUsuario ? styles.userBubble : styles.iaBubble,
            item.error && styles.errorBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              esUsuario ? styles.userText : styles.iaText,
            ]}
          >
            {item.texto}
          </Text>

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
          <Ionicons name="sparkles" size={18} color={colors.white} />
        </View>

        <View style={[styles.messageBubble, styles.iaBubble, styles.typingBubble]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.typingText}>...</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Si viene del tab (sin onBack) → cabecera AXIS estándar */}
      {/* Si viene como sub-pantalla (con onBack) → cabecera con botón atrás */}
      {onBack ? (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerBrand}>
            <View style={styles.headerIcon}>
              <Ionicons name="sparkles" size={16} color={colors.white} />
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
        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>Preguntas rápidas</Text>
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

        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item) => item.id}
          renderItem={renderMensaje}
          ListFooterComponent={renderTyping}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        {recorderState.isRecording && (
          <View style={styles.recordingBar}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Grabando {formatearTiempo(segundosGrabando)} / 01:00</Text>
          </View>
        )}

        {audioUri && !recorderState.isRecording && !enviando && (
          <View style={styles.audioReadyBar}>
            <Ionicons name="mic" size={18} color={colors.primary} />
            <Text style={styles.audioReadyText}>Audio listo ({formatearTiempo(segundosGrabando)})</Text>
            <TouchableOpacity onPress={enviarAudioManual}>
              <Text style={styles.audioSendText}>Enviar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.audioCancelBtn} onPress={() => { setAudioUri(null); setSegundosGrabando(0); }}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputArea}>
          <TouchableOpacity
            style={[styles.micBtn, recorderState.isRecording && styles.micBtnRecording]}
            onPress={recorderState.isRecording ? () => detenerGrabacion(false) : iniciarGrabacion}
            disabled={enviando}
          >
            <Ionicons name={recorderState.isRecording ? 'stop' : 'mic-outline'} size={22} color={colors.white} />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Escribe tu consulta..."
            placeholderTextColor={colors.textMuted}
            value={texto}
            onChangeText={setTexto}
            multiline
            editable={!enviando && !recorderState.isRecording}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!texto.trim() || enviando) && styles.sendBtnDisabled]}
            onPress={enviarTexto}
            disabled={!texto.trim() || enviando}
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
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerBrand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
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
    width: 30,
  },
  body: {
    flex: 1,
  },
  quickSection: {
    backgroundColor: colors.background,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quickTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  quickList: {
    paddingHorizontal: spacing.lg,
  },
  quickChip: {
    backgroundColor: colors.white,
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
  messagesContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
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
    borderRadius: radius.sm,
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
  recordingBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: colors.danger,
    marginRight: spacing.sm,
  },
  recordingText: {
    fontSize: typography.size.sm,
    color: '#991B1B',
    fontWeight: typography.weight.bold,
  },
  audioReadyBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioReadyText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.size.sm,
    color: '#1E3A8A',
    fontWeight: typography.weight.bold,
  },
  audioSendText: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
  audioCancelBtn: {
    marginLeft: spacing.sm,
  },
  inputArea: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  micBtnRecording: {
    backgroundColor: colors.danger,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 92,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendBtnDisabled: {
    opacity: 0.45,
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
    borderRadius: radius.sm,
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
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  confirmNoText: {
    color: colors.danger,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    marginLeft: 5,
  },
});