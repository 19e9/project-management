import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { api } from '../../src/lib/api-client';

interface Task {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  priority: string;
  wbsCode?: string | null;
  durationDays: number;
}

export default function TasksScreen() {
  const { workspaceId, projectId, projectName } = useLocalSearchParams<{
    workspaceId: string;
    projectId: string;
    projectName?: string;
  }>();
  const { data, isLoading } = useQuery({
    enabled: !!workspaceId && !!projectId,
    queryKey: ['tasks', workspaceId, projectId],
    queryFn: async () =>
      (await api.get(`/workspaces/${workspaceId}/projects/${projectId}/tasks`))
        .data as Task[],
  });

  return (
    <View style={styles.wrap}>
      <Stack.Screen options={{ title: projectName ?? 'Tasks' }} />
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={{ color: '#64748b' }}>No tasks yet.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.title}>
                  {item.wbsCode ? `${item.wbsCode}  ` : ''}
                  {item.title}
                </Text>
                <Text style={[styles.badge, badgeColor(item.status)]}>
                  {item.status}
                </Text>
              </View>
              <Text style={styles.meta}>
                {item.startDate.slice(0, 10)} → {item.endDate.slice(0, 10)} ·{' '}
                {item.durationDays}d · {item.priority}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function badgeColor(status: string) {
  switch (status) {
    case 'done':
      return { backgroundColor: '#dcfce7', color: '#15803d' };
    case 'in_progress':
      return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
    case 'blocked':
      return { backgroundColor: '#fef3c7', color: '#b45309' };
    case 'cancelled':
      return { backgroundColor: '#f1f5f9', color: '#64748b' };
    default:
      return { backgroundColor: '#f1f5f9', color: '#334155' };
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f8fafc' },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  title: { fontWeight: '600', flex: 1, paddingRight: 10 },
  meta: { color: '#64748b', fontSize: 12, marginTop: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 11,
    overflow: 'hidden',
  },
});
