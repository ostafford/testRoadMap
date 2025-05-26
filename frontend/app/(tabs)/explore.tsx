import { StyleSheet, Text, View } from 'react-native';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧭 Explore Memories</Text>
      <Text style={styles.subtitle}>Discover authentic stories from others</Text>
      <Text style={styles.status}>✅ Memory discovery features coming soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
});