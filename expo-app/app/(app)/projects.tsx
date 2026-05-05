import { useQuery } from '@tanstack/react-query';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../../src/lib/api-client';

export default function ProjectsScreen() {
  const { workspaceId } = useLocalSearchParams<{ workspaceId: string }>();
  const { data, isLoading } = useQuery({
    enabled: !!workspaceId,
    queryKey: ['projects', workspaceId],
    queryFn: async () =>
      (await api.get(`/workspaces/${workspaceId}/projects`)).data as Array<any>,
  });

  return (
    <View style={styles.wrap}>
      <Stack.Screen options={{ title: 'Projects' }} />
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={{ color: '#64748b' }}>No projects yet.</Text>
          }
          renderItem={({ item }) => (
            <Link
              href={{
                pathname: '/(app)/tasks',
                params: { workspaceId, projectId: item.id, projectName: item.name },
              }}
              asChild
            >
              <Pressable style={styles.card}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {!!item.description && (
                  <Text style={styles.cardSub} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
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
  cardSub: { color: '#64748b', fontSize: 13, marginTop: 4 },
});
