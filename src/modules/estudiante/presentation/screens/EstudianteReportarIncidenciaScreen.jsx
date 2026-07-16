import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

import AppHeader from '../../../../shared/components/organisms/AppHeader';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';
import {
  obtenerClaseActual,
  crearReporteClaseActualEstudiante,
} from '../../services/estudianteApi';

const CLERK_JWT_TEMPLATE = 'Axis';
const MAX_IMAGENES = 3;

const GRAVEDADES = [
  { value: 'baja', label: 'Baja', description: 'No impide la clase', icon: 'information-circle-outline' },
  { value: 'media', label: 'Media', description: 'Afecta el uso normal', icon: 'warning-outline' },
  { value: 'alta', label: 'Alta', description: 'Requiere atención urgente', icon: 'alert-circle-outline' },
];

export default function EstudianteReportarIncidenciaScreen() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [claseActual, setClaseActual] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [gravedad, setGravedad] = useState('media');
  const [imagenes, setImagenes] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTipo, setModalTipo] = useState('success');
  const [modalTitulo, setModalTitulo] = useState('');
  const [modalMensaje, setModalMensaje] = useState('');

  const obtenerTokenAxis = async () => {
    const token = await getToken({ template: CLERK_JWT_TEMPLATE, skipCache: true });
    if (!token) throw new Error('No se pudo obtener una sesión activa.');
    return token;
  };

  const cargarClaseActual = async () => {
    try {
      setLoading(true);
      const token = await obtenerTokenAxis();
      const response = await obtenerClaseActual({ token });
      setClaseActual(response?.data || null);
    } catch (error) {
      mostrarModal({ tipo: 'error', titulo: 'No se pudo cargar', mensaje: error.message || 'No se pudo validar la clase actual.' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarClaseActual();
    }, [])
  );

  const mostrarModal = ({ tipo = 'success', titulo, mensaje }) => {
    setModalTipo(tipo);
    setModalTitulo(titulo);
    setModalMensaje(mensaje);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    if (modalTipo === 'success') router.replace('/(estudiante)/reportes');
  };

  const seleccionarImagen = async () => {
    try {
      if (imagenes.length >= MAX_IMAGENES) {
        throw new Error(`Solo puedes adjuntar hasta ${MAX_IMAGENES} imágenes.`);
      }

      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        throw new Error('Debes permitir el acceso a tus fotos para adjuntar una imagen.');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.75,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      setImagenes((prev) => [...prev, asset].slice(0, MAX_IMAGENES));
    } catch (error) {
      mostrarModal({ tipo: 'error', titulo: 'Imagen no agregada', mensaje: error.message || 'No se pudo agregar la imagen.' });
    }
  };

  const quitarImagen = (index) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  const enviarReporte = async () => {
    try {
      if (!claseActual) {
        throw new Error('No tienes una clase activa en este momento. Solo puedes reportar durante tu clase actual.');
      }

      if (descripcion.trim().length < 10) {
        throw new Error('Describe la incidencia con al menos 10 caracteres.');
      }

      setEnviando(true);
      const token = await obtenerTokenAxis();

      const response = await crearReporteClaseActualEstudiante({
        token,
        descripcion: descripcion.trim(),
        gravedad,
        imagenes,
      });

      mostrarModal({ tipo: 'success', titulo: 'Reporte enviado', mensaje: response?.message || 'El reporte fue registrado correctamente.' });
    } catch (error) {
      mostrarModal({ tipo: 'error', titulo: 'No se pudo enviar', mensaje: error.message || 'No se pudo registrar el reporte.' });
    } finally {
      setEnviando(false);
    }
  };

  const irRuta = () => {
    if (!claseActual?.id) return;
    router.push(`/(estudiante)/ruta-clase/${claseActual.id}`);
  };

  const renderClaseActual = () => {
    if (!claseActual) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons name="time-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Sin clase activa</Text>
          <Text style={styles.emptyText}>Los reportes estudiantiles solo están disponibles durante la clase en curso.</Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace('/(estudiante)/clases')} activeOpacity={0.85}>
            <Text style={styles.backHomeText}>Volver a mis clases</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.classCard}>
        <View style={styles.classHeader}>
          <View style={styles.classIcon}>
            <Ionicons name="school-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.classTextBox}>
            <Text style={styles.classLabel}>Clase actual</Text>
            <Text style={styles.classTitle}>{claseActual.materia}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <InfoRow icon="business-outline" label="Aula" value={claseActual.aula} />
          <InfoRow icon="location-outline" label="Edificio" value={claseActual.edificio?.nombre} />
          <InfoRow icon="time-outline" label="Horario" value={`${claseActual.hora_inicio} - ${claseActual.hora_fin}`} />
        </View>

        <TouchableOpacity style={styles.routeBtn} onPress={irRuta} activeOpacity={0.85}>
          <Ionicons name="navigate-outline" size={17} color={colors.primary} />
          <Text style={styles.routeBtnText}>Ver ruta al aula</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <AppHeader rol="estudiante" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={21} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Reportar incidencia</Text>
          <Text style={styles.headerSubtitle}>Solo para tu clase actual</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Validando clase actual...</Text>
            </View>
          ) : (
            <>
              {renderClaseActual()}

              {claseActual && (
                <>
                  <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Describe el problema</Text>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Ejemplo: El proyector no enciende o falta un cable HDMI."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      value={descripcion}
                      onChangeText={setDescripcion}
                      editable={!enviando}
                      maxLength={500}
                    />
                    <Text style={styles.counterText}>{descripcion.trim().length}/500</Text>
                  </View>

                  <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Fotos del inconveniente</Text>
                    <Text style={styles.helpText}>Opcional. Puedes adjuntar hasta {MAX_IMAGENES} imágenes.</Text>

                    <View style={styles.imagesRow}>
                      {imagenes.map((imagen, index) => (
                        <View key={`${imagen.uri}-${index}`} style={styles.imageBox}>
                          <Image source={{ uri: imagen.uri }} style={styles.previewImage} />
                          <TouchableOpacity style={styles.removeImageBtn} onPress={() => quitarImagen(index)}>
                            <Ionicons name="close" size={15} color={colors.white} />
                          </TouchableOpacity>
                        </View>
                      ))}

                      {imagenes.length < MAX_IMAGENES && (
                        <TouchableOpacity style={styles.addImageBtn} onPress={seleccionarImagen} activeOpacity={0.85} disabled={enviando}>
                          <Ionicons name="image-outline" size={23} color={colors.primary} />
                          <Text style={styles.addImageText}>Agregar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Nivel de gravedad</Text>
                    <View style={styles.gravedadList}>
                      {GRAVEDADES.map((item) => {
                        const active = gravedad === item.value;
                        return (
                          <TouchableOpacity key={item.value} style={[styles.gravedadItem, active && styles.gravedadItemActive]} onPress={() => setGravedad(item.value)} activeOpacity={0.85} disabled={enviando}>
                            <View style={[styles.gravedadIcon, active && styles.gravedadIconActive]}>
                              <Ionicons name={item.icon} size={18} color={active ? colors.white : colors.primary} />
                            </View>
                            <View style={styles.gravedadTextBox}>
                              <Text style={styles.gravedadTitle}>{item.label}</Text>
                              <Text style={styles.gravedadDescription}>{item.description}</Text>
                            </View>
                            {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <TouchableOpacity style={[styles.submitBtn, enviando && styles.submitBtnDisabled]} onPress={enviarReporte} activeOpacity={0.85} disabled={enviando}>
                    {enviando ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="send-outline" size={18} color={colors.white} />}
                    <Text style={styles.submitBtnText}>{enviando ? 'Enviando...' : 'Enviar reporte'}</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={cerrarModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, modalTipo === 'error' && styles.modalIconError]}>
              <Ionicons name={modalTipo === 'error' ? 'alert-circle-outline' : 'checkmark-circle-outline'} size={34} color={modalTipo === 'error' ? '#DC2626' : '#16A34A'} />
            </View>
            <Text style={styles.modalTitle}>{modalTitulo}</Text>
            <Text style={styles.modalText}>{modalMensaje}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={cerrarModal} activeOpacity={0.85}>
              <Text style={styles.modalBtnText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={colors.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'No registrado'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  headerTextBox: { flex: 1 },
  headerTitle: { fontSize: typography.size.md, color: colors.textPrimary, fontWeight: typography.weight.bold },
  headerSubtitle: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 1 },
  body: { flex: 1 },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  classCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  classHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  classIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  classTextBox: { flex: 1 },
  classLabel: { fontSize: 11, color: colors.primary, fontWeight: typography.weight.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
  classTitle: { fontSize: typography.size.lg, color: colors.textPrimary, fontWeight: typography.weight.bold, marginTop: 2 },
  infoBox: { backgroundColor: '#F8FAFC', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  infoLabel: { width: 72, marginLeft: 7, fontSize: 11, color: colors.textMuted, fontWeight: typography.weight.bold, textTransform: 'uppercase' },
  infoValue: { flex: 1, fontSize: typography.size.sm, color: colors.textPrimary, fontWeight: typography.weight.semibold },
  routeBtn: { marginTop: spacing.sm, minHeight: 42, borderRadius: radius.md, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  routeBtnText: { color: colors.primary, fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  formCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontSize: typography.size.md, color: colors.textPrimary, fontWeight: typography.weight.bold, marginBottom: spacing.sm },
  helpText: { fontSize: typography.size.xs, color: colors.textSecondary, marginBottom: spacing.sm },
  textArea: { minHeight: 130, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top', color: colors.textPrimary, fontSize: typography.size.sm, backgroundColor: '#F8FAFC' },
  counterText: { alignSelf: 'flex-end', marginTop: 6, fontSize: 11, color: colors.textMuted },
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  imageBox: { width: 86, height: 86, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  removeImageBtn: { position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  addImageBtn: { width: 86, height: 86, borderRadius: radius.md, borderWidth: 1, borderColor: '#BFDBFE', backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  addImageText: { marginTop: 4, fontSize: 11, color: colors.primary, fontWeight: typography.weight.bold },
  gravedadList: { gap: spacing.sm },
  gravedadItem: { minHeight: 58, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: '#F8FAFC', flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm },
  gravedadItemActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  gravedadIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  gravedadIconActive: { backgroundColor: colors.primary },
  gravedadTextBox: { flex: 1 },
  gravedadTitle: { fontSize: typography.size.sm, color: colors.textPrimary, fontWeight: typography.weight.bold },
  gravedadDescription: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  submitBtn: { minHeight: 50, borderRadius: radius.md, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: colors.white, fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  emptyCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: 'center' },
  emptyTitle: { fontSize: typography.size.md, color: colors.textPrimary, fontWeight: typography.weight.bold, marginTop: spacing.sm },
  emptyText: { fontSize: typography.size.sm, color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  backHomeBtn: { marginTop: spacing.md, minHeight: 42, borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  backHomeText: { color: colors.white, fontSize: typography.size.sm, fontWeight: typography.weight.bold },
  loadingCard: { minHeight: 280, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.sm, fontSize: typography.size.sm, color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalCard: { width: '100%', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  modalIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  modalIconError: { backgroundColor: '#FEE2E2' },
  modalTitle: { fontSize: typography.size.lg, color: colors.textPrimary, fontWeight: typography.weight.bold, textAlign: 'center' },
  modalText: { fontSize: typography.size.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  modalBtn: { marginTop: spacing.md, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, alignSelf: 'stretch' },
  modalBtnText: { color: colors.white, fontSize: typography.size.sm, fontWeight: typography.weight.bold },
});
