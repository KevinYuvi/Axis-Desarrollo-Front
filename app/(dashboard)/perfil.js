import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '../../src/shared/hooks/useClerkOrMock';
import { colors } from '../../src/shared/theme/colors';
import { typography } from '../../src/shared/theme/typography';
import { spacing, radius } from '../../src/shared/theme/spacing';
import { AppHeader } from '../../src/shared/components';

const ROL_LABEL = {
  estudiante: 'Estudiante',
  docente: 'Docente',
  ayudante: 'Ayudante',
  admin: 'Administrador',
};

export default function PerfilScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const rol = user?.publicMetadata?.rol?.toLowerCase() || 'estudiante';
  const email = user?.primaryEmailAddress?.emailAddress || '';

  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(user?.firstName || '');
  const [apellido, setApellido] = useState(user?.lastName || '');
  const [guardando, setGuardando] = useState(false);

  const displayName = user?.fullName || user?.firstName || 'Usuario';

  const guardarPerfil = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }

    try {
      setGuardando(true);
      await user.update({
        firstName: nombre.trim(),
        lastName: apellido.trim(),
      });
      setEditando(false);
    } catch (err) {
      Alert.alert('Error', err.errors?.[0]?.message || 'No se pudo actualizar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (e) {
      console.error('Error signing out:', e);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <AppHeader rol={rol} />

      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color={colors.primary} />
            </View>
            
            {!editando ? (
              <>
                <Text style={styles.nombre}>{displayName}</Text>
                <Text style={styles.email}>{email}</Text>
                <View style={styles.rolBadge}>
                  <Text style={styles.rolBadgeText}>{ROL_LABEL[rol] || 'Usuario'}</Text>
                </View>
                
                <TouchableOpacity style={styles.editBtn} onPress={() => setEditando(true)}>
                  <Ionicons name="pencil" size={14} color={colors.primary} />
                  <Text style={styles.editBtnText}>Editar Perfil</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Tu nombre"
                  editable={!guardando}
                />
                
                <Text style={styles.inputLabel}>Apellido</Text>
                <TextInput
                  style={styles.input}
                  value={apellido}
                  onChangeText={setApellido}
                  placeholder="Tu apellido"
                  editable={!guardando}
                />

                <View style={styles.formActions}>
                  <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => {
                      setNombre(user?.firstName || '');
                      setApellido(user?.lastName || '');
                      setEditando(false);
                    }}
                    disabled={guardando}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.saveBtn, guardando && styles.disabledBtn]} 
                    onPress={guardarPerfil}
                    disabled={guardando}
                  >
                    {guardando ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.saveBtnText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Separador */}
          <View style={styles.divider} />

          {/* Info extra */}
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>Universidad Central del Ecuador</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoText}>Cuenta verificada con Clerk</Text>
          </View>

          <View style={styles.divider} />

          {/* Cerrar sesión */}
          <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: spacing.sm }} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  avatarContainer: { alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  nombre: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.textPrimary },
  email: { fontSize: typography.size.sm, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.sm },
  rolBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full, marginBottom: spacing.md },
  rolBadgeText: { color: colors.primary, fontWeight: typography.weight.bold, fontSize: typography.size.xs },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  editBtnText: { color: colors.primary, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  formContainer: { width: '100%', marginTop: spacing.sm },
  inputLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, fontSize: typography.size.md, color: colors.textPrimary, backgroundColor: colors.background },
  formActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  cancelBtn: { flex: 1, padding: spacing.md, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { color: colors.textPrimary, fontWeight: typography.weight.bold },
  saveBtn: { flex: 1, padding: spacing.md, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.primary },
  saveBtnText: { color: colors.white, fontWeight: typography.weight.bold },
  disabledBtn: { opacity: 0.6 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  infoText: { fontSize: typography.size.sm, color: colors.textSecondary },
  logoutButton: { backgroundColor: colors.danger, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.md, marginTop: spacing.sm },
  logoutText: { color: '#fff', fontWeight: typography.weight.bold, fontSize: typography.size.md },
});