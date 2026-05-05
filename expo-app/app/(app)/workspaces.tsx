import { useQuery } from '@tanstack/react-query';
import { Link, Stack } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../../src/lib/api-client';
import { useAuth } from '../../src/features/auth/AuthProvider';

export default function WorkspacesScreen() {
  const { signOut } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => (await api.get('/workspaces')).data as Array<any>,
  });

  return (
    <View style={styles.wrap}>
      <Stack.Screen
        options={{
          title: 'Workspaces',
          headerRight: () => (
            <Pressable onPress={signOut}>
              <Text style={{ color: '#4f46e5', fontWeight: '600' }}>Sign out</Text>
            </Pressable>
          ),
        }}
      />
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(w) => w.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={{ color: '#64748b' }}>
              No workspaces yet — create one on the web app.
            </Text>
          }
          renderItem={({ item }) => (
            <Link
              href={{ pathname: '/(app)/projects', params: { workspaceId: item.id } }}
              asChild
            >
              <Pressable style={styles.card}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>
                  Plan: {item.plan} · Role: {item.role}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8fafc' },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  cardTitle: { fontWeight: '600', fontSize: 16 },
  cardSub: { color: '#64748b', fontSize: 12, marginTop: 4 },
});
