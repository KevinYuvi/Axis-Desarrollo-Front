import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authStyles as styles } from '../../src/shared/theme/authStyles';

export default function RegisterScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados de error
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    let isValid = true;

    // VALIDACIÓN REGEX
    const regexUCE = /^[a-zA-Z0-9._%+-]+@uce\.edu\.ec$/;
    if (!regexUCE.test(emailAddress)) {
      setEmailError('Solo se admiten correos @uce.edu.ec');
      isValid = false;
    }

    if (password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);
    try {
      await signUp.create({ emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      console.error(err);
      setGeneralError(err?.errors?.[0]?.message || 'Ocurrió un error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    
    setCodeError('');
    setGeneralError('');

    if (code.trim() === '') {
      setCodeError('Debes ingresar el código recibido');
      return;
    }

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      
      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
      } else {
         setGeneralError('Faltan datos para completar el registro.');
      }
    } catch (err) {
      console.error(err);
      setCodeError('El código es incorrecto o ha expirado.');
    } finally {
      setLoading(false);
    }
  };

  // PANTALLA DE VERIFICACIÓN
  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}><Ionicons name="mail-unread-outline" size={36} color="white" /></View>
          <Text style={styles.titleText}>Verificar Correo</Text>
          <Text style={styles.subtitleText}>Ingresa el código enviado a {emailAddress}</Text>
        </View>

        {generalError ? (
          <View style={styles.generalErrorBox}>
            <Text style={styles.errorText}>{generalError}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Código de verificación</Text>
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
        
        <TouchableOpacity style={styles.primaryButton} onPress={onPressVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Verificar Código</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  // PANTALLA NORMAL DE REGISTRO
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}><Ionicons name="school-outline" size={36} color="white" /></View>
        <Text style={styles.titleText}>AXIS</Text>
        <Text style={styles.subtitleText}>Crea tu cuenta institucional</Text>
      </View>

      <Text style={styles.headerText}>Registrarse</Text>

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

      <TouchableOpacity style={styles.primaryButton} onPress={onSignUpPress} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Registrarse</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchFlowContainer} onPress={() => router.back()}>
        <Text style={styles.switchFlowText}>¿Ya tienes una cuenta? <Text style={styles.switchFlowLink}>Inicia sesión</Text></Text>
      </TouchableOpacity>
    </View>
  );
}