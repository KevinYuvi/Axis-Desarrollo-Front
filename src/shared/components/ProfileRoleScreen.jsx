import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

export default function ProfileRoleScreen({
  rolNombre = 'Usuario',
  rolMetadata = 'usuario',
  rolIcon = 'person-outline',
  rolColor = colors.primary,
  rolBg = '#EFF6FF',
  backRoute = '/',
}) {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useAuth();

  const [modalSalirVisible, setModalSalirVisible] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);

  const nombre = user?.fullName || rolNombre;
  const email = user?.primaryEmailAddress?.emailAddress || 'Sin correo';

  const rol =
    user?.publicMetadata?.rol?.toString?.().toLowerCase?.() || rolMetadata;

  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  const cerrarSesion = async () => {
    try {
      setCerrandoSesion(true);

      await signOut();

      setModalSalirVisible(false);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error cerrando sesión:', error);

      setModalSalirVisible(false);
      setErrorModalVisible(true);
    } finally {
      setCerrandoSesion(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace(backRoute)}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mi perfil</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: rolBg,
                borderColor: rolColor,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: rolColor }]}>
              {iniciales || rolNombre[0]}
            </Text>
          </View>

          <Text style={styles.nombre} numberOfLines={1}>
            {nombre}
          </Text>

          <Text style={styles.email} numberOfLines={1}>
            {email}
          </Text>

          <View style={[styles.rolBadge, { backgroundColor: rolBg }]}>
            <Ionicons name={rolIcon} size={13} color={rolColor} />

            <Text style={[styles.rolText, { color: rolColor }]}>
              {rol.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Información de cuenta</Text>

          <InfoRow
            icon="mail-outline"
            label="Correo institucional"
            value={email}
          />

          <View style={styles.divider} />

          <InfoRow
            icon="briefcase-outline"
            label="Rol asignado"
            value={rolNombre}
          />

          <View style={styles.divider} />

          <InfoRow
            icon="shield-checkmark-outline"
            label="Estado"
            value="Cuenta activa"
          />
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setModalSalirVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalSalirVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalSalirVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconDanger}>
              <Ionicons name="log-out-outline" size={30} color="#DC2626" />
            </View>

            <Text style={styles.modalTitle}>Cerrar sesión</Text>

            <Text style={styles.modalText}>
              ¿Seguro que deseas salir de tu cuenta?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalSalirVisible(false)}
                disabled={cerrandoSesion}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  cerrandoSesion && styles.modalBtnDisabled,
                ]}
                onPress={cerrarSesion}
                disabled={cerrandoSesion}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmText}>
                  {cerrandoSesion ? 'Saliendo...' : 'Salir'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconError}>
              <Ionicons name="alert-circle-outline" size={30} color="#DC2626" />
            </View>

            <Text style={styles.modalTitle}>Error</Text>

            <Text style={styles.modalText}>No se pudo cerrar sesión.</Text>

            <TouchableOpacity
              style={styles.modalSingleBtn}
              onPress={() => setErrorModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalSingleText}>Entendido</Text>
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
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={19} color={colors.primary} />
      </View>

      <View style={styles.infoTextBox}>
        <Text style={styles.label}>{label}</Text>

        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
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

  headerTitle: {
    flex: 1,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },

  headerSpacer: {
    width: 38,
  },

  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  profileCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
  },

  avatarText: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
  },

  nombre: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    maxWidth: '90%',
  },

  email: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 4,
    maxWidth: '90%',
  },

  rolBadge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  rolText: {
    fontSize: 12,
    fontWeight: typography.weight.bold,
  },

  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },

  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  infoTextBox: {
    flex: 1,
  },

  label: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },

  value: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  logoutBtn: {
    minHeight: 54,
    backgroundColor: colors.danger || '#EF4444',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
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

  modalIconDanger: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  modalIconError: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  modalText: {
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
    backgroundColor: colors.danger || '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalConfirmText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },

  modalBtnDisabled: {
    opacity: 0.65,
  },

  modalSingleBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalSingleText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
});