import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authStyles as styles } from '../../src/shared/theme/authStyles';

export default function RegisterScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

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
        error?.errors?.[0]?.message ||
          'El código es incorrecto o ha expirado.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (verificandoCorreo) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Ionicons name="mail-outline" size={36} color="white" />
          </View>

          <Text style={styles.titleText}>Verifica tu correo</Text>

          <Text style={styles.subtitleText}>
            Ingresa el código enviado a {emailAddress.trim().toLowerCase()}
          </Text>
        </View>

        {generalError ? (
          <View style={styles.generalErrorBox}>
            <Text style={styles.errorText}>{generalError}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Código de verificación</Text>

          <TextInput
            style={[styles.input, codigoError ? styles.inputError : null]}
            value={codigo}
            onChangeText={(text) => {
              setCodigo(text);
              setCodigoError('');
            }}
            placeholder="123456"
            placeholderTextColor="#A1A1AA"
            keyboardType="number-pad"
            maxLength={6}
          />

          {codigoError ? (
            <Text style={styles.errorText}>{codigoError}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onVerifyPress}
          disabled={loading || !isLoaded}
        >
          {loading || !isLoaded ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Verificar cuenta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchFlowContainer}
          onPress={() => {
            setVerificandoCorreo(false);
            setCodigo('');
            setCodigoError('');
            setGeneralError('');
          }}
          disabled={loading}
        >
          <Text style={styles.switchFlowText}>Volver atrás</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Ionicons name="person-add-outline" size={36} color="white" />
        </View>

        <Text style={styles.titleText}>Crear cuenta</Text>

        <Text style={styles.subtitleText}>
          Regístrate con tu correo institucional
        </Text>
      </View>

      <Text style={styles.headerText}>Registro</Text>

      {generalError ? (
        <View style={styles.generalErrorBox}>
          <Text style={styles.errorText}>{generalError}</Text>
        </View>
      ) : null}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nombre</Text>

        <TextInput
          style={[styles.input, nombreError ? styles.inputError : null]}
          value={nombre}
          onChangeText={(text) => {
            setNombre(text);
            setNombreError('');
            setGeneralError('');
          }}
          placeholder="Nombre"
          placeholderTextColor="#A1A1AA"
        />

        {nombreError ? <Text style={styles.errorText}>{nombreError}</Text> : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Apellido</Text>

        <TextInput
          style={[styles.input, apellidoError ? styles.inputError : null]}
          value={apellido}
          onChangeText={(text) => {
            setApellido(text);
            setApellidoError('');
            setGeneralError('');
          }}
          placeholder="Apellido"
          placeholderTextColor="#A1A1AA"
        />

        {apellidoError ? (
          <Text style={styles.errorText}>{apellidoError}</Text>
        ) : null}
      </View>

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
            placeholder="Mínimo 8 caracteres"
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
        style={styles.primaryButton}
        onPress={onSignUpPress}
        disabled={loading || !isLoaded}
      >
        {loading || !isLoaded ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Crear cuenta</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchFlowContainer}
        onPress={() => router.push('/(auth)/login')}
        disabled={loading}
      >
        <Text style={styles.switchFlowText}>
          ¿Ya tienes una cuenta?{' '}
          <Text style={styles.switchFlowLink}>Inicia sesión</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}