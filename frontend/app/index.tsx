import { Text, View, StyleSheet } from 'react-native';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🗺️ ReMap</Text>
      <Text style={styles.subtitle}>Your Interactive Memory Atlas</Text>
      <Text style={styles.status}>✅ Basic setup working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    color: '#1F2937',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  status: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
});