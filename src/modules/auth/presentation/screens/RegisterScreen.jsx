import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

export default function RegisterScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const apellidoInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const codigoInputRef = useRef(null);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');

  const [verificandoCorreo, setVerificandoCorreo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [generalError, setGeneralError] = useState('');
  const [nombreError, setNombreError] = useState('');
  const [apellidoError, setApellidoError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [codigoError, setCodigoError] = useState('');

  const limpiarErrores = () => {
    setGeneralError('');
    setNombreError('');
    setApellidoError('');
    setEmailError('');
    setPasswordError('');
    setCodigoError('');
  };

  const validarFormularioRegistro = () => {
    limpiarErrores();

    let valido = true;

    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();
    const correoLimpio = emailAddress.trim().toLowerCase();

    const regexUCE = /^[a-zA-Z0-9._%+-]+@uce\.edu\.ec$/;

    if (!nombreLimpio) {
      setNombreError('El nombre es obligatorio');
      valido = false;
    }

    if (!apellidoLimpio) {
      setApellidoError('El apellido es obligatorio');
      valido = false;
    }

    if (!regexUCE.test(correoLimpio)) {
      setEmailError('Solo se admiten correos @uce.edu.ec');
      valido = false;
    }

    if (password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      valido = false;
    }

    return valido;
  };

  const onSignUpPress = async () => {
    if (!isLoaded || loading) return;

    const valido = validarFormularioRegistro();

    if (!valido) return;

    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();
    const correoLimpio = emailAddress.trim().toLowerCase();

    try {
      setLoading(true);

      await signUp.create({
        firstName: nombreLimpio,
        lastName: apellidoLimpio,
        emailAddress: correoLimpio,
        password,
        unsafeMetadata: {
          rol: 'estudiante',
        },
      });

      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setVerificandoCorreo(true);

      setTimeout(() => {
        codigoInputRef.current?.focus();
      }, 300);
    } catch (error) {
      console.error('ERROR REGISTRO CLERK:', error);

      setGeneralError(
        error?.errors?.[0]?.message ||
          'No se pudo crear la cuenta. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded || loading) return;

    limpiarErrores();

    const codigoLimpio = codigo.trim();

    if (!codigoLimpio) {
      setCodigoError('Ingresa el código enviado a tu correo');
      return;
    }

    try {
      setLoading(true);

      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: codigoLimpio,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({
          session: signUpAttempt.createdSessionId,
        });

        router.replace('/');
        return;
      }

      setGeneralError(`No se pudo completar el registro: ${signUpAttempt.status}`);
    } catch (error) {
      console.error('ERROR VERIFICANDO CORREO:', error);

      setCodigoError(
        error?.errors?.[0]?.message || 'El código es incorrecto o ha expirado.'
      );
    } finally {
      setLoading(false);
    }
  };

  const volverARegistro = () => {
    setVerificandoCorreo(false);
    setCodigo('');
    setCodigoError('');
    setGeneralError('');
  };

  const irALogin = () => {
    if (loading) return;
    router.push('/(auth)/login');
  };

  if (verificandoCorreo) {
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
                <Ionicons name="mail-outline" size={36} color={colors.primary} />
              </View>

              <Text style={styles.brand}>AXIS</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Verificar correo</Text>

              <Text style={styles.verifyEmailText}>
                {emailAddress.trim().toLowerCase()}
              </Text>

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
                <Text style={styles.inputLabel}>Código</Text>

                <View
                  style={[
                    styles.inputWrapper,
                    codigoError ? styles.inputWrapperError : null,
                  ]}
                >
                  <Ionicons
                    name="keypad-outline"
                    size={20}
                    color={codigoError ? '#DC2626' : colors.textSecondary}
                  />

                  <TextInput
                    ref={codigoInputRef}
                    style={styles.input}
                    value={codigo}
                    onChangeText={(text) => {
                      setCodigo(text);
                      setCodigoError('');
                      setGeneralError('');
                    }}
                    placeholder="123456"
                    placeholderTextColor="#A1A1AA"
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={onVerifyPress}
                  />
                </View>

                {codigoError ? (
                  <Text style={styles.errorText}>{codigoError}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (loading || !isLoaded) && styles.disabledButton,
                ]}
                onPress={onVerifyPress}
                disabled={loading || !isLoaded}
                activeOpacity={0.85}
              >
                {loading || !isLoaded ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verificar</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.switchFlowContainer}
              onPress={volverARegistro}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.switchFlowText}>Volver atrás</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.sectionTitle}>Crear cuenta</Text>

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

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.inputLabel}>Nombre</Text>

                <View
                  style={[
                    styles.inputWrapper,
                    nombreError ? styles.inputWrapperError : null,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    value={nombre}
                    onChangeText={(text) => {
                      setNombre(text);
                      setNombreError('');
                      setGeneralError('');
                    }}
                    placeholder="Nombre"
                    placeholderTextColor="#A1A1AA"
                    editable={!loading}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => apellidoInputRef.current?.focus()}
                  />
                </View>

                {nombreError ? (
                  <Text style={styles.errorText}>{nombreError}</Text>
                ) : null}
              </View>

              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.inputLabel}>Apellido</Text>

                <View
                  style={[
                    styles.inputWrapper,
                    apellidoError ? styles.inputWrapperError : null,
                  ]}
                >
                  <TextInput
                    ref={apellidoInputRef}
                    style={styles.input}
                    value={apellido}
                    onChangeText={(text) => {
                      setApellido(text);
                      setApellidoError('');
                      setGeneralError('');
                    }}
                    placeholder="Apellido"
                    placeholderTextColor="#A1A1AA"
                    editable={!loading}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                  />
                </View>

                {apellidoError ? (
                  <Text style={styles.errorText}>{apellidoError}</Text>
                ) : null}
              </View>
            </View>

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
                  ref={emailInputRef}
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
              <Text style={styles.inputLabel}>Contraseña</Text>

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
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor="#A1A1AA"
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={onSignUpPress}
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
              onPress={onSignUpPress}
              disabled={loading || !isLoaded}
              activeOpacity={0.85}
            >
              {loading || !isLoaded ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.switchFlowContainer}
            onPress={irALogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.switchFlowText}>
              ¿Ya tienes una cuenta?{' '}
              <Text style={styles.switchFlowLink}>Inicia sesión</Text>
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

  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  halfInput: {
    flex: 1,
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

  verifyEmailText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.lg,
  },
});