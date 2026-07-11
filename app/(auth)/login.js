import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authStyles as styles } from '../../src/shared/theme/authStyles';

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

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

      setGeneralError(`No se pudo completar el inicio de sesión: ${signInAttempt.status}`);
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

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Ionicons name="school-outline" size={36} color="white" />
        </View>

        <Text style={styles.titleText}>AXIS</Text>

        <Text style={styles.subtitleText}>
          Sistema Inteligente de Gestión Universitaria
        </Text>
      </View>

      <Text style={styles.headerText}>Iniciar sesión</Text>

      {generalError ? (
        <View style={styles.generalErrorBox}>
          <Text style={styles.errorText}>{generalError}</Text>
        </View>
      ) : null}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Correo Institucional</Text>

        <TextInput
          style={[styles.input, emailError ? styles.inputError : null]}
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
        />

        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Contraseña</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={[
              styles.input,
              styles.passwordInput,
              passwordError ? styles.inputError : null,
            ]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
              setGeneralError('');
            }}
            secureTextEntry={!showPassword}
            placeholder="••••••••"
            placeholderTextColor="#A1A1AA"
          />

          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.forgotPasswordContainer}
        onPress={() =>
          Alert.alert(
            'Recuperar contraseña',
            'La recuperación de contraseña se conectará después.'
          )
        }
      >
        <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onSignInPress}
        disabled={loading || !isLoaded}
      >
        {loading || !isLoaded ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchFlowContainer}
        onPress={() => router.push('/(auth)/register')}
        disabled={loading}
      >
        <Text style={styles.switchFlowText}>
          ¿No tienes una cuenta?{' '}
          <Text style={styles.switchFlowLink}>Regístrate</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}