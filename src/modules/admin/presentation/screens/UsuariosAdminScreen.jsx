import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl, ActionSheetIOS, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const ROLES = ['estudiante', 'docente', 'ayudante', 'admin'];

const ROL_CONFIG = {
  estudiante: { bg: '#DBEAFE', text: '#2563EB', icon: 'school-outline' },
  docente:    { bg: '#DCFCE7', text: '#16A34A', icon: 'book-outline' },
  ayudante:   { bg: '#FEF9C3', text: '#CA8A04', icon: 'construct-outline' },
  admin:      { bg: '#F3E8FF', text: '#9333EA', icon: 'shield-checkmark-outline' },
};

export default function UsuariosAdminScreen({ token, onBack }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);
  const [errorConfig, setErrorConfig] = useState(false);

  const cargarUsuarios = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      setErrorConfig(false);

      const res = await fetch(`${API_URL}/api/v1/usuarios/`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      const data = await res.json();
      
      if (!res.ok) {
        if (data?.detail?.includes('CLERK_SECRET_KEY')) {
          setErrorConfig(true);
          return;
        }
        throw new Error(data?.detail || 'Error al cargar los usuarios');
      }

      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);

  const asignarRol = async (userId, nuevoRol) => {
    try {
      setProcesandoId(userId);
      const res = await fetch(`${API_URL}/api/v1/usuarios/${userId}/rol?nuevo_rol=${nuevoRol}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.detail || 'Error al asignar el rol');
      }

      // Update local state to avoid full reload
      setUsuarios((prev) => 
        prev.map((u) => u.id === userId ? { ...u, rol: nuevoRol } : u)
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setProcesandoId(null);
    }
  };

  const solicitarCambioRol = (usuario) => {
    const rolActual = (usuario.rol || 'estudiante').toLowerCase();
    
    if (Platform.OS === 'ios') {
      const options = [...ROLES, 'Cancelar'];
      const cancelButtonIndex = ROLES.length;
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: `Asignar rol a ${usuario.nombre || usuario.email}`,
          message: `Rol actual: ${rolActual}`
        },
        (buttonIndex) => {
          if (buttonIndex !== cancelButtonIndex) {
            const nuevoRol = ROLES[buttonIndex];
            if (nuevoRol !== rolActual) asignarRol(usuario.id, nuevoRol);
          }
        }
      );
    } else {
      // Para Android/Web usamos un Alert con opciones simples
      const botones = ROLES.map(r => ({
        text: r.charAt(0).toUpperCase() + r.slice(1),
        onPress: () => {
          if (r !== rolActual) asignarRol(usuario.id, r);
        }
      }));
      botones.push({ text: 'Cancelar', style: 'cancel' });

      Alert.alert(
        'Cambiar Rol',
        `Selecciona el nuevo rol para ${usuario.nombre || usuario.email}`,
        botones,
        { cancelable: true }
      );
    }
  };

  const renderUsuario = ({ item }) => {
    const rol = (item.rol || 'estudiante').toLowerCase();
    const cfg = ROL_CONFIG[rol] || ROL_CONFIG.estudiante;
    const isProcesando = procesandoId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.nombre} numberOfLines={1}>
              {item.nombre || 'Usuario sin nombre'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.rolBadge, { backgroundColor: cfg.bg }]}
          onPress={() => solicitarCambioRol(item)}
          disabled={isProcesando}
        >
          {isProcesando ? (
            <ActivityIndicator size="small" color={cfg.text} />
          ) : (
            <>
              <Ionicons name={cfg.icon} size={14} color={cfg.text} />
              <Text style={[styles.rolText, { color: cfg.text }]}>
                {rol.charAt(0).toUpperCase() + rol.slice(1)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (errorConfig) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <Ionicons name="construct-outline" size={54} color={colors.warning} />
          <Text style={styles.emptyTitle}>Configuración Requerida</Text>
          <Text style={styles.emptyMsg}>
            Falta la variable CLERK_SECRET_KEY en el backend para poder leer y escribir roles.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.actionStrip}>
        <Text style={styles.subtitle}>{usuarios.length} usuarios registrados</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item.id}
          renderItem={renderUsuario}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargarUsuarios(true); }} tintColor={colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.textPrimary },
  headerSpacer: { width: 32 },
  actionStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white },
  subtitle: { fontSize: typography.size.sm, color: colors.textSecondary },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  textWrap: { flex: 1 },
  nombre: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textPrimary },
  email: { fontSize: typography.size.xs, color: colors.textSecondary, marginTop: 2 },
  rolBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.sm },
  rolText: { fontSize: 12, fontWeight: typography.weight.bold },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyTitle: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.xs, textAlign: 'center' },
  emptyMsg: { fontSize: typography.size.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
