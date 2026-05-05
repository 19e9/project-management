import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/features/auth/AuthProvider';
import { ActivityIndicator, View } from 'react-native';

export default function AppLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!user) return <Redirect href="/(auth)/login" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#0f172a',
      }}
    />
  );
}
