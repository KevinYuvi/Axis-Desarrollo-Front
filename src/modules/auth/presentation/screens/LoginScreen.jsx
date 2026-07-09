import { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator, // Importamos para el estado de carga
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Input, Button } from '../../../../shared/components';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

// 🔌 Recibimos onLoginSubmit desde App.js
export default function LoginScreen({ onDemoAccess, onLoginSubmit }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Estado para controlar el spinner del login

  const handleLogin = async () => {
    if (correo.trim() === '' || password.trim() === '') {
      Alert.alert('Campos incompletos', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }

    if (onLoginSubmit) {
      setLoading(true);
      // Ejecutamos la función asíncrona de App.js que va hacia Docker
      await onLoginSubmit(correo, password);
      setLoading(false);
    } else {
      Alert.alert('Error', 'El método de autenticación no está configurado.');
    }
  };

  const handleDemoAccess = () => {
    if (onDemoAccess) {
      onDemoAccess();
    } else {
      Alert.alert('Acceso demo como estudiante');
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandBlock}>
            <View style={styles.iconContainer}>
              <Image
                source={require('../../../../../assets/axis_la_central_conectada_icon.png')}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brand}>AXIS</Text>
            <Text style={styles.brandSubtitle}>Smart Campus UCE</Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>La Central conectada</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Iniciar sesión</Text>

            <Text style={styles.fieldLabel}>CORREO INSTITUCIONAL</Text>
            <Input
              placeholder="usuario@uce.edu.ec"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none" // Evita que ponga la primera en mayúscula automáticamente
              editable={!loading}   // Bloquea el input si está cargando
            />

            <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
            <Input
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}   // Bloquea el input si está cargando
            />

            <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>

            <View style={styles.buttonContainer}>
              {loading ? (
                <ActivityIndicator size="large" color={colors?.primary || '#2F80ED'} style={{ marginVertical: 10 }} />
              ) : (
                <Button title="Iniciar sesión" onPress={handleLogin} />
              )}
              
              <Text style={styles.helpText}>Usa tu correo institucional UCE</Text>
              <View style={{ height: spacing.sm }} />
              <Button
                title="Ingresar como estudiante demo"
                variant="secondary"
                onPress={handleDemoAccess}
                disabled={loading} // Deshabilita el demo si está cargando el login real
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Mantenemos tus estilos exactamente intactos tal como los tienes abajo
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF' },
  flex: { flex: 1 },
  content: { padding: 24, justifyContent: 'center' },
  brandBlock: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  iconContainer: { width: 80, height: 80, marginBottom: 12 },
  icon: { width: '100%', height: '100%' },
  brand: { fontSize: 28, fontWeight: 'bold', color: '#1B1B1B' },
  brandSubtitle: { fontSize: 16, color: '#828282', marginBottom: 8 },
  chip: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  chipText: { color: '#2F80ED', fontSize: 12, fontWeight: '600' },
  formContainer: { backgroundColor: '#FFF' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 24, color: '#1B1B1B' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#828282', marginBottom: 6, letterSpacing: 1 },
  forgotPassword: { fontSize: 13, color: '#2F80ED', textAlign: 'right', marginTop: 8, fontWeight: '500' },
  buttonContainer: { marginTop: 24, alignItems: 'center', width: '100%' },
  helpText: { fontSize: 12, color: '#BDBDBD', marginTop: 8 },
});