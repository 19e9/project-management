import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.wrap}>
        <Text style={styles.h1}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          Go home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  h1: { fontSize: 18, fontWeight: '600' },
  link: { marginTop: 12, color: '#4f46e5' },
});
