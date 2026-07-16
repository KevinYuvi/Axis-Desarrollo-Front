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
import { useAuth } from '@clerk/clerk-expo';

import AppHeader from '../../../../shared/components/organisms/AppHeader';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const CLERK_JWT_TEMPLATE = 'Axis';

const preguntasRapidas = [
  'Enlístame las aulas disponibles ahora.',
  'Quiero reservar el Aula 5 mañana de 7 am a 9 am.',
  '¿Qué horarios tiene el Aula 4?',
  'El proyector del Aula 4 no funciona.',
];

export default function AsistenteIAScreen({ token, rol }) {
  const { getToken } = useAuth();

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const timerRef = useRef(null);
  const flatListRef = useRef(null);

  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [segundosGrabando, setSegundosGrabando] = useState(0);
  const [audioUri, setAudioUri] = useState(null);
  const [mostrarRapidas, setMostrarRapidas] = useState(false);
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);

  const [mensajes, setMensajes] = useState([
    {
      id: 'inicio',
      tipo: 'ia',
      texto:
        'Puedo ayudarte a reservar aulas, consultar disponibilidad o registrar reportes.',
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

  const obtenerTokenActual = async () => {
    const tokenActual = await getToken({
      template: CLERK_JWT_TEMPLATE,
      skipCache: true,
    });

    if (tokenActual) return tokenActual;
    if (token) return token;

    throw new Error('No se pudo obtener una sesión activa. Vuelve a iniciar sesión.');
  };

  const leerRespuestaSegura = async (response, valorInicial = {}) => {
    const rawText = await response.text();

    if (!rawText) return valorInicial;

    try {
      return JSON.parse(rawText);
    } catch {
      return valorInicial;
    }
  };

  const convertirErrorAtexto = (errorData) => {
    if (!errorData) return 'No se pudo procesar la solicitud.';
    if (typeof errorData === 'string') return errorData;

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

      if (errorData.message) return convertirErrorAtexto(errorData.message);
      if (errorData.detail) return convertirErrorAtexto(errorData.detail);
      if (errorData.error) return convertirErrorAtexto(errorData.error);

      try {
        return JSON.stringify(errorData, null, 2);
      } catch {
        return 'No se pudo procesar la solicitud.';
      }
    }

    return String(errorData);
  };

  const validarApiUrl = () => {
    if (!API_URL) {
      throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.');
    }

    if (
      Platform.OS !== 'web' &&
      (API_URL.includes('localhost') || API_URL.includes('127.0.0.1'))
    ) {
      throw new Error(
        'En Android no uses localhost. Usa la IP de tu computadora, por ejemplo: http://192.168.1.20:8000'
      );
    }
  };

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
            detenerGrabacion();
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

  const construirTextoConContexto = (textoEnviar) => {
    const textoBase = String(textoEnviar || '').trim();

    if (!aulaSeleccionada?.nombre) {
      return textoBase;
    }

    const contexto = `Aula seleccionada: ${aulaSeleccionada.nombre}`;

    if (!textoBase) {
      return contexto;
    }

    return `${textoBase}. ${contexto}`;
  };

  const enviarSolicitud = async (
    textoEnviar = '',
    uriAudio = null,
    duracion = null
  ) => {
    try {
      setEnviando(true);

      validarApiUrl();

      const tokenActual = await obtenerTokenActual();

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
      const textoConContexto = construirTextoConContexto(textoEnviar);

      if (textoConContexto) {
        formData.append('texto_chat', textoConContexto);
      }

      if (uriAudio) {
        const nombreArchivo =
          Platform.OS === 'web' ? 'audio_axis.webm' : 'audio_axis.m4a';

        const tipoArchivo = Platform.OS === 'web' ? 'audio/webm' : 'audio/mp4';

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
          Authorization: `Bearer ${tokenActual}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const data = await leerRespuestaSegura(response, {});

      if (!response.ok) {
        console.log('ERROR BACKEND IA:', data);

        const mensajeError = convertirErrorAtexto(data);

        throw new Error(mensajeError || 'No se pudo procesar la solicitud.');
      }

      agregarMensaje({
        tipo: 'ia',
        texto: construirTextoRespuesta(data),
        detalle: data,
      });

      if (
        data?.accion === 'RESERVA' &&
        ['success', 'cancelada'].includes(data?.status)
      ) {
        setAulaSeleccionada(null);
      }
    } catch (error) {
      console.error('Error enviando solicitud IA:', error);

      agregarMensaje({
        tipo: 'ia',
        texto:
          error.message ||
          'No se pudo procesar la solicitud. Revisa la conexión con el backend.',
        error: true,
      });
    } finally {
      setEnviando(false);
    }
  };

  const construirTextoRespuesta = (data) => {
    if (!data) return 'Listo, procesé tu solicitud.';

    if (Array.isArray(data.espacios) && data.espacios.length > 0) {
      const total = data.espacios.length;

      if (
        data.respuesta_app?.toLowerCase?.().includes('disponible') ||
        data.origen_peticion?.toLowerCase?.().includes('disponible')
      ) {
        return `Encontré ${total} espacio${total === 1 ? '' : 's'} disponible${total === 1 ? '' : 's'}. Selecciona uno para continuar.`;
      }

      return `Encontré ${total} espacio${total === 1 ? '' : 's'}. Selecciona uno para continuar.`;
    }

    return data?.respuesta_app || 'Listo, procesé tu solicitud.';
  };

  const obtenerAulaDetalle = (detalle) => {
    return (
      detalle?.aula_identificada ||
      detalle?.reserva?.espacio_nombre ||
      detalle?.reserva_pendiente?.espacio_nombre ||
      detalle?.detalle_aula?.nombre ||
      null
    );
  };

  const parseFechaBackend = (valor) => {
    if (!valor) return null;
    if (valor instanceof Date) return valor;

    const textoFecha = String(valor).replace(' ', 'T');
    const fecha = new Date(textoFecha);

    if (Number.isNaN(fecha.getTime())) return null;

    return fecha;
  };

  const formatearFechaHoraCorta = (valor) => {
    const fecha = parseFechaBackend(valor);

    if (!fecha) return String(valor || '');

    const hoy = new Date();
    const manana = new Date();
    manana.setDate(hoy.getDate() + 1);

    const mismaFecha =
      fecha.getFullYear() === hoy.getFullYear() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getDate() === hoy.getDate();

    const esManana =
      fecha.getFullYear() === manana.getFullYear() &&
      fecha.getMonth() === manana.getMonth() &&
      fecha.getDate() === manana.getDate();

    const hora = fecha.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (mismaFecha) return `Hoy ${hora}`;
    if (esManana) return `Mañana ${hora}`;

    return `${fecha.toLocaleDateString()} ${hora}`;
  };

  const formatearSoloHora = (valor) => {
    const fecha = parseFechaBackend(valor);

    if (!fecha) return String(valor || '');

    return fecha.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const seleccionarAula = (espacio) => {
    setAulaSeleccionada(espacio);

    agregarMensaje({
      tipo: 'ia',
      texto: `Seleccionaste ${espacio.nombre}. Ahora puedes pedir el horario, hacer una reserva o registrar un reporte sobre esta aula.`,
      seleccionContextual: true,
    });
  };

  const renderResumenReserva = (detalle) => {
    if (!detalle || detalle.accion !== 'RESERVA') return null;

    const aula = obtenerAulaDetalle(detalle);
    const reserva = detalle.reserva || detalle.reserva_pendiente;

    let subtitulo = aula || 'Aula seleccionada';

    if (reserva?.hora_inicio && reserva?.hora_fin) {
      subtitulo = `${aula || 'Aula'} · ${formatearFechaHoraCorta(
        reserva.hora_inicio
      )} - ${formatearSoloHora(reserva.hora_fin)}`;
    }

    return (
      <View style={styles.cleanCard}>
        <View style={styles.cleanIconBlue}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        </View>

        <View style={styles.cleanTextBox}>
          <Text style={styles.cleanTitle}>
            {detalle.status === 'success'
              ? 'Reserva creada'
              : detalle.status === 'cancelada'
                ? 'Reserva cancelada'
                : detalle.status === 'requiere_horario'
                  ? 'Falta el horario'
                  : detalle.status === 'error'
                    ? 'No disponible'
                    : 'Reserva por confirmar'}
          </Text>

          <Text style={styles.cleanSubtitle}>{subtitulo}</Text>
        </View>
      </View>
    );
  };

  const renderResumenReporte = (detalle) => {
    if (!detalle || detalle.accion !== 'REPORTE') return null;

    const aula = obtenerAulaDetalle(detalle);

    return (
      <View style={styles.cleanCard}>
        <View style={styles.cleanIconOrange}>
          <Ionicons name="construct-outline" size={18} color="#D97706" />
        </View>

        <View style={styles.cleanTextBox}>
          <Text style={styles.cleanTitle}>Reporte registrado</Text>
          <Text style={styles.cleanSubtitle}>{aula || 'Aula asociada'}</Text>
        </View>
      </View>
    );
  };

  const renderEspaciosSeleccionables = (detalle) => {
    if (!Array.isArray(detalle?.espacios) || detalle.espacios.length === 0) {
      return null;
    }

    return (
      <View style={styles.selectableList}>
        {detalle.espacios.slice(0, 6).map((espacio) => {
          const estaSeleccionada = aulaSeleccionada?.id === espacio.id;

          return (
            <TouchableOpacity
              key={espacio.id}
              style={[
                styles.selectableCard,
                estaSeleccionada && styles.selectableCardActive,
              ]}
              onPress={() => seleccionarAula(espacio)}
              activeOpacity={0.85}
              disabled={enviando}
            >
              <View style={styles.selectableTop}>
                <View
                  style={[
                    styles.spaceIconBox,
                    estaSeleccionada && styles.spaceIconBoxActive,
                  ]}
                >
                  <Ionicons
                    name={estaSeleccionada ? 'checkmark' : 'business-outline'}
                    size={17}
                    color={estaSeleccionada ? colors.white : colors.primary}
                  />
                </View>

                <View style={styles.spaceInfo}>
                  <Text style={styles.spaceName}>{espacio.nombre}</Text>

                  <Text style={styles.spaceMeta}>
                    {espacio.bloque || 'Sin bloque'} · {espacio.tipo || 'Espacio'}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={colors.textMuted}
                />
              </View>

              {estaSeleccionada && (
                <Text style={styles.selectedHint}>
                  Aula seleccionada para la siguiente consulta.
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {detalle.espacios.length > 6 && (
          <Text style={styles.moreSpacesText}>
            +{detalle.espacios.length - 6} espacio(s) más
          </Text>
        )}
      </View>
    );
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

          {!item.error && renderResumenReserva(item.detalle)}
          {!item.error && renderResumenReporte(item.detalle)}
          {!item.error && renderEspaciosSeleccionables(item.detalle)}

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
                  onPress={() => enviarSolicitud('cancelar reserva', null, null)}
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
        placeholder={
          aulaSeleccionada
            ? 'Pide horario, reserva o reporte...'
            : 'Escribe tu consulta...'
        }
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

      <AppHeader rol={rol || 'docente'} />

      <View style={styles.pageHeader}>
        <View style={styles.pageIcon}>
          <Ionicons
            name="hardware-chip-outline"
            size={17}
            color={colors.primary}
          />
        </View>

        <View style={styles.pageHeaderText}>
          <Text style={styles.pageTitle}>Asistente IA</Text>
          <Text style={styles.pageSubtitle}>
            Reservas, reportes y disponibilidad
          </Text>
        </View>
      </View>

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

        {aulaSeleccionada && (
          <View style={styles.selectedAulaBar}>
            <View style={styles.selectedAulaInfo}>
              <Ionicons name="business-outline" size={16} color={colors.primary} />

              <Text style={styles.selectedAulaText} numberOfLines={1}>
                Aula seleccionada: {aulaSeleccionada.nombre}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.selectedAulaClose}
              onPress={() => setAulaSeleccionada(null)}
              disabled={enviando}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
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

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  pageIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  pageHeaderText: {
    flex: 1,
  },

  pageTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  pageSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 1,
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
    maxWidth: '82%',
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
    lineHeight: 21,
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

  cleanCard: {
    marginTop: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cleanIconBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  cleanIconOrange: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  cleanTextBox: {
    flex: 1,
  },

  cleanTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  cleanSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },

  selectableList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },

  selectableCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },

  selectableCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },

  selectableTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  spaceIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  spaceIconBoxActive: {
    backgroundColor: colors.primary,
  },

  spaceInfo: {
    flex: 1,
  },

  spaceName: {
    fontSize: typography.size.xs,
    color: colors.textPrimary,
    fontWeight: typography.weight.bold,
  },

  spaceMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  selectedHint: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.sm,
  },

  selectedAulaBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedAulaInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginRight: spacing.sm,
  },

  selectedAulaText: {
    flex: 1,
    marginLeft: 7,
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },

  selectedAulaClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  moreSpacesText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    marginTop: 2,
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