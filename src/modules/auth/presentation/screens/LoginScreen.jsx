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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Input from '../../../../shared/components/Input';
import Button from '../../../../shared/components/Button';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing, radius } from '../../../../shared/theme/spacing';

export default function LoginScreen({ onDemoAccess }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    Alert.alert('Inicio de sesión simulado');
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
            />

            <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
            <Input
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>

            <View style={styles.buttonContainer}>
              <Button title="Iniciar sesión" onPress={handleLogin} />
              <Text style={styles.helpText}>Usa tu correo institucional UCE</Text>
              <View style={{ height: spacing.sm }} />
              <Button
                title="Ingresar como estudiante demo"
                variant="secondary"
                onPress={handleDemoAccess}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    width: 32,
    height: 32,
  },
  brand: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  chip: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}1A`,
  },
  chipText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: typography.size.xl || 24,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    textAlign: 'left',
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  helpText: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  forgotPassword: {
    fontSize: typography.size.sm,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
