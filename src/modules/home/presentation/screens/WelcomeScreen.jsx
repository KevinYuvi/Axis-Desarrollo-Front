import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Header, Card, Badge, Button, Input } from '../../../../shared/components';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { spacing } from '../../../../shared/theme/spacing';

export default function WelcomeScreen() {
  const [correo, setCorreo] = useState('');

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Header
        title="Axis"
        subtitle="Sistema inteligente para encontrar espacios disponibles"
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Estados de disponibilidad</Text>
          <View style={styles.badgeRow}>
            <Badge label="Libre" variant="success" />
            <Badge label="Próximo" variant="warning" />
            <Badge label="Ocupado" variant="critical" />
            <Badge label="Sin datos" variant="neutral" />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Campo de ejemplo</Text>
          <Input
            label="Correo institucional"
            placeholder="nombre@uce.edu.ec"
            value={correo}
            onChangeText={setCorreo}
          />
          <Button title="Continuar" onPress={() => {}} />
          <View style={styles.buttonGap} />
          <Button title="Acción secundaria" variant="secondary" onPress={() => {}} />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  buttonGap: {
    height: spacing.sm,
  },
});
