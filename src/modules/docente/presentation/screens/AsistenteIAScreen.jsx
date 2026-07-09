import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const preguntasRapidas = [
  '¿Dónde queda el Laboratorio de Computación 3?',
  'El proyector del Laboratorio de Computación 3 no enciende.',
  '¿Tengo una clase activa en este momento?',
  'Quiero reportar una computadora dañada.',
];

export default function AsistenteIAScreen({ token, onBack, onVerReportes }) {
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
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
        </View>

        <View style={[styles.messageBubble, styles.iaBubble, styles.typingBubble]}>
          <ActivityIndicator size="small" color="#2F80ED" />
          <Text style={styles.typingText}>...</Text>
        </View>
      </View>
    );
  };

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
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            </View>

            <Text style={styles.brandText}>Asistente IA</Text>
          </View>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Profesor</Text>
          </View>
        </View>

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
              <Text style={styles.recordingText}>
                Grabando {formatearTiempo(segundosGrabando)} / 01:00
              </Text>
            </View>
          )}

          {audioUri && !recorderState.isRecording && !enviando && (
            <View style={styles.audioReadyBar}>
              <Ionicons name="mic" size={18} color="#2F80ED" />

              <Text style={styles.audioReadyText}>
                Audio listo ({formatearTiempo(segundosGrabando)})
              </Text>

              <TouchableOpacity onPress={enviarAudioManual}>
                <Text style={styles.audioSendText}>Enviar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.audioCancelBtn}
                onPress={() => {
                  setAudioUri(null);
                  setSegundosGrabando(0);
                }}
              >
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputArea}>
            <TouchableOpacity
              style={[
                styles.micBtn,
                recorderState.isRecording && styles.micBtnRecording,
              ]}
              onPress={
                recorderState.isRecording
                  ? () => detenerGrabacion(false)
                  : iniciarGrabacion
              }
              disabled={enviando}
            >
              <Ionicons
                name={recorderState.isRecording ? 'stop' : 'mic-outline'}
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Escribe tu consulta..."
              placeholderTextColor="#9CA3AF"
              value={texto}
              onChangeText={setTexto}
              multiline
              editable={!enviando && !recorderState.isRecording}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!texto.trim() || enviando) && styles.sendBtnDisabled,
              ]}
              onPress={enviarTexto}
              disabled={!texto.trim() || enviando}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem} onPress={onBack}>
            <Ionicons name="business-outline" size={22} color="#828282" />
            <Text style={styles.tabLabel}>Mi Aula</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={onVerReportes}
            disabled={!onVerReportes}
          >
            <Ionicons name="document-text-outline" size={22} color="#828282" />
            <Text style={styles.tabLabel}>Reportes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="chatbox-ellipses" size={22} color="#2F80ED" />
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>
              Asistente IA
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
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
    flexShrink: 1,
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

  body: {
    flex: 1,
  },

  quickSection: {
    backgroundColor: '#F9FAFC',
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  quickTitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 8,
    paddingHorizontal: 18,
  },

  quickList: {
    paddingHorizontal: 18,
  },

  quickChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    maxWidth: 260,
  },

  quickChipText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },

  messagesContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
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
    borderRadius: 10,
    backgroundColor: '#2F80ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },

  messageBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  iaBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  userBubble: {
    backgroundColor: '#2F80ED',
  },

  errorBubble: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },

  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  typingText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '700',
    marginLeft: 8,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },

  iaText: {
    color: '#111827',
  },

  userText: {
    color: '#FFFFFF',
  },

  resultCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },

  resultTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  resultSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },

  statusMiniBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 8,
  },

  statusMiniText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '800',
  },

  recordingBar: {
    marginHorizontal: 18,
    marginBottom: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  recordingDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },

  recordingText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '700',
  },

  audioReadyBar: {
    marginHorizontal: 18,
    marginBottom: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  audioReadyText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '700',
  },

  audioSendText: {
    fontSize: 13,
    color: '#2F80ED',
    fontWeight: '800',
  },

  audioCancelBtn: {
    marginLeft: 10,
  },

  inputArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#2F80ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  micBtnRecording: {
    backgroundColor: '#EF4444',
  },

  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 92,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },

  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#2F80ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  sendBtnDisabled: {
    opacity: 0.45,
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
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  confirmYesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F80ED',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },

  confirmYesText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 5,
  },

  confirmNoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },

  confirmNoText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 5,
  },
});