import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const passwordInputRef = useRef(null);

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const limpiarErrores = () => {
    setEmailError('');
    setPasswordError('');
    setGeneralError('');
  };

  const validarFormulario = () => {
    limpiarErrores();

    let valido = true;

    const correoLimpio = emailAddress.trim().toLowerCase();
    const regexUCE = /^[a-zA-Z0-9._%+-]+@uce\.edu\.ec$/;

    if (!regexUCE.test(correoLimpio)) {
      setEmailError('Solo se admiten correos @uce.edu.ec');
      valido = false;
    }

    if (!password.trim()) {
      setPasswordError('La contraseña es obligatoria');
      valido = false;
    }

    return valido;
  };

  const onSignInPress = async () => {
    if (!isLoaded || loading) return;

    const formularioValido = validarFormulario();

    if (!formularioValido) return;

    const correoLimpio = emailAddress.trim().toLowerCase();

    try {
      setLoading(true);

      const signInAttempt = await signIn.create({
        identifier: correoLimpio,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({
          session: signInAttempt.createdSessionId,
        });

        router.replace('/');
        return;
      }

      setGeneralError(
        `No se pudo completar el inicio de sesión: ${signInAttempt.status}`
      );
    } catch (error) {
      console.error('ERROR LOGIN CLERK:', error);

      setGeneralError(
        error?.errors?.[0]?.message ||
          'Credenciales incorrectas. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const recuperarPassword = () => {
    Alert.alert(
      'Recuperar contraseña',
      'La recuperación de contraseña se conectará después.'
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <View style={styles.logoBox}>
              <Image
                source={require('../../../../../assets/axis_la_central_conectada_icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.brand}>AXIS</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Iniciar sesión</Text>

            {generalError ? (
              <View style={styles.generalErrorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#DC2626"
                />
                <Text style={styles.generalErrorText}>{generalError}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo institucional</Text>

              <View
                style={[
                  styles.inputWrapper,
                  emailError ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={emailError ? '#DC2626' : colors.textSecondary}
                />

                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={emailAddress}
                  onChangeText={(text) => {
                    setEmailAddress(text);
                    setEmailError('');
                    setGeneralError('');
                  }}
                  placeholder="usuario@uce.edu.ec"
                  placeholderTextColor="#A1A1AA"
                  editable={!loading}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>

              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>Contraseña</Text>

                <TouchableOpacity
                  onPress={recuperarPassword}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.inputWrapper,
                  passwordError ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={passwordError ? '#DC2626' : colors.textSecondary}
                />

                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError('');
                    setGeneralError('');
                  }}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#A1A1AA"
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={onSignInPress}
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (loading || !isLoaded) && styles.disabledButton,
              ]}
              onPress={onSignInPress}
              disabled={loading || !isLoaded}
              activeOpacity={0.85}
            >
              {loading || !isLoaded ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Ingresar</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.switchFlowContainer}
            onPress={() => router.push('/(auth)/register')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.switchFlowText}>
              ¿No tienes una cuenta?{' '}
              <Text style={styles.switchFlowLink}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  flex: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },

  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  logoBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  logo: {
    width: 54,
    height: 54,
  },

  brand: {
    fontSize: 32,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    letterSpacing: 3,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },

  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },

  generalErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: spacing.md,
  },

  generalErrorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },

  inputGroup: {
    marginBottom: spacing.md,
  },

  inputLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },

  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  forgotPasswordText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: typography.weight.bold,
    marginBottom: 8,
  },

  inputWrapper: {
    minHeight: 54,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  inputWrapperError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },

  input: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    fontWeight: typography.weight.semibold,
    paddingVertical: 0,
    minHeight: 48,
  },

  eyeButton: {
    padding: 4,
  },

  errorText: {
    color: '#DC2626',
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    marginTop: 6,
  },

  primaryButton: {
    minHeight: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },

  disabledButton: {
    opacity: 0.65,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },

  switchFlowContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },

  switchFlowText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },

  switchFlowLink: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
});