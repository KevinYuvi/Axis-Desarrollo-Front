import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function StartPage() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2F80ED" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});