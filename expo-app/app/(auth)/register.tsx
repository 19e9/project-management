import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/features/auth/AuthProvider';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.wrap}
    >
      <Text style={styles.brand}>PlanForge</Text>
      <Text style={styles.h1}>Create account</Text>

      <TextInput
        placeholder="Full name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password (min 8 chars)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        onPress={async () => {
          setBusy(true);
          setError(null);
          try {
            await signUp(email, password, name);
            router.replace('/(app)/workspaces');
          } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Sign up failed');
          } finally {
            setBusy(false);
          }
        }}
        style={[styles.btn, busy && { opacity: 0.6 }]}
        disabled={busy}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign up</Text>}
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        I already have an account
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  brand: { fontSize: 14, color: '#475569', marginBottom: 8 },
  h1: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  error: { color: '#dc2626', marginBottom: 8 },
  btn: {
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600' },
  link: { color: '#4f46e5', marginTop: 16, textAlign: 'center' },
});
