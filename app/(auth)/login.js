import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authStyles as styles } from '../../src/theme/authStyles';

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // === NUEVOS ESTADOS PARA VERIFICACIÓN DE DISPOSITIVO NUEVO (2FA) ===
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const onSignInPress = async () => {
    if (!isLoaded) return;

    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    let isValid = true;
    const cleanEmail = emailAddress.trim(); 

    const regexUCE = /^[a-zA-Z0-9._%+-]+@uce\.edu\.ec$/;
    if (!regexUCE.test(cleanEmail)) {
      setEmailError('Solo se admiten correos @uce.edu.ec');
      isValid = false;
    }

    if (password === '') {
      setPasswordError('La contraseña es obligatoria');
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);
    try {
      const completeSignIn = await signIn.create({ 
        identifier: cleanEmail, 
        password: password 
      });
      
      if (completeSignIn.status === 'complete') {
        // Dispositivo conocido -> Entra directo
        await setActive({ session: completeSignIn.createdSessionId });
        
      } else if (completeSignIn.status === 'needs_second_factor') {
        // === LA MAGIA AQUÍ ===
        // Dispositivo nuevo detectado. Le pedimos a Clerk que envíe el código.
        await signIn.prepareSecondFactor({ strategy: 'email_code' });
        setIsVerifying2FA(true); // Cambiamos la pantalla para pedir el código
        
      } else if (completeSignIn.status === 'needs_first_factor') {
        setGeneralError('Esta cuenta aún no ha sido verificada. Regístrate de nuevo.');
      } else {
        setGeneralError(`Estado inesperado: ${completeSignIn.status}`);
      }
    } catch (err) {
      console.error(err);
      setGeneralError(err?.errors?.[0]?.message || 'Credenciales incorrectas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función para procesar el código del correo
  const onVerify2FAPress = async () => {
    if (!isLoaded) return;
    setCodeError('');
    setGeneralError('');

    if (code.trim() === '') {
      setCodeError('Debes ingresar el código recibido en tu correo');
      return;
    }

    setLoading(true);
    try {
      const completeSignIn = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code: code.trim(),
      });

      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });
      } else {
        setGeneralError('Faltan datos para completar el inicio de sesión.');
      }
    } catch (err) {
      console.error(err);
      setCodeError(err?.errors?.[0]?.message || 'El código es incorrecto o ha expirado.');
    } finally {
      setLoading(false);
    }
  };

  // === PANTALLA DE VERIFICACIÓN (Aparece solo si es un dispositivo nuevo) ===
  if (isVerifying2FA) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}><Ionicons name="shield-checkmark-outline" size={36} color="white" /></View>
          <Text style={styles.titleText}>Dispositivo Nuevo</Text>
          <Text style={styles.subtitleText}>Por seguridad, ingresa el código enviado a {emailAddress}</Text>
        </View>

        {generalError ? (
          <View style={styles.generalErrorBox}>
            <Text style={styles.errorText}>{generalError}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Código de seguridad</Text>
          <TextInput
            style={[styles.input, codeError ? styles.inputError : null]}
            value={code}
            onChangeText={(text) => {
              setCode(text);
              setCodeError('');
            }}
            placeholder="123456"
            placeholderTextColor="#A1A1AA"
            keyboardType="number-pad"
          />
          {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={onVerify2FAPress} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Autorizar e Iniciar Sesión</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchFlowContainer} onPress={() => setIsVerifying2FA(false)}>
          <Text style={styles.switchFlowText}>Volver atrás</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // === PANTALLA NORMAL DE LOGIN ===
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}><Ionicons name="school-outline" size={36} color="white" /></View>
        <Text style={styles.titleText}>AXIS</Text>
        <Text style={styles.subtitleText}>Sistema Inteligente de Gestión Universitaria</Text>
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
            style={[styles.input, styles.passwordInput, passwordError ? styles.inputError : null]} 
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
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      </View>

      <TouchableOpacity style={styles.forgotPasswordContainer}>
        <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={onSignInPress} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Iniciar sesión</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchFlowContainer} onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.switchFlowText}>¿No tienes una cuenta? <Text style={styles.switchFlowLink}>Regístrate</Text></Text>
      </TouchableOpacity>
    </View>
  );
}