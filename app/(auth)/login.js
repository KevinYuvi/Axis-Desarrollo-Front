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
  
  // Estados para los mensajes de error en pantalla
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const onSignInPress = async () => {
    if (!isLoaded) return;

    // Limpiamos errores previos
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    let isValid = true;

    // VALIDACIÓN REGEX: Solo correos de la UCE
    const regexUCE = /^[a-zA-Z0-9._%+-]+@uce\.edu\.ec$/;
    if (!regexUCE.test(emailAddress)) {
      setEmailError('Solo se admiten correos @uce.edu.ec');
      isValid = false;
    }

    if (password.trim() === '') {
      setPasswordError('La contraseña es obligatoria');
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);
    try {
      const completeSignIn = await signIn.create({ identifier: emailAddress, password });
      
      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });
      } else if (completeSignIn.status === 'needs_first_factor') {
        setGeneralError('Esta cuenta aún no ha sido verificada. Por favor, regístrate de nuevo para verificar tu correo.');
      } else {
        setGeneralError(`Estado inesperado de la cuenta: ${completeSignIn.status}`);
      }
    } catch (err) {
      console.error(err);
      setGeneralError(err?.errors?.[0]?.message || 'Credenciales incorrectas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}><Ionicons name="school-outline" size={36} color="white" /></View>
        <Text style={styles.titleText}>AXIS</Text>
        <Text style={styles.subtitleText}>Sistema Inteligente de Gestión Universitaria</Text>
      </View>

      <Text style={styles.headerText}>Iniciar sesión</Text>

      {/* Mostrar error general (ej: credenciales incorrectas) */}
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
        <TextInput
          style={[styles.input, passwordError ? styles.inputError : null]} 
          value={password} 
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError('');
            setGeneralError('');
          }} 
          secureTextEntry={true} 
          placeholder="••••••••"
          placeholderTextColor="#A1A1AA"
        />
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