import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const apiBaseUrl =
  (Constants.expoConfig?.extra as any)?.apiBaseUrl ??
  'http://localhost:3000/api/v1';

export const api = axios.create({ baseURL: apiBaseUrl });

const ACCESS = 'planforge.access';
const REFRESH = 'planforge.refresh';
let memoryAccess: string | null = null;

export const tokens = {
  async load() {
    memoryAccess = (await SecureStore.getItemAsync(ACCESS)) ?? null;
  },
  async set(access: string, refresh: string) {
    memoryAccess = access;
    await SecureStore.setItemAsync(ACCESS, access);
    await SecureStore.setItemAsync(REFRESH, refresh);
  },
  async clear() {
    memoryAccess = null;
    await SecureStore.deleteItemAsync(ACCESS);
    await SecureStore.deleteItemAsync(REFRESH);
  },
  async getRefresh() {
    return SecureStore.getItemAsync(REFRESH);
  },
};

api.interceptors.request.use(async (cfg: InternalAxiosRequestConfig) => {
  if (memoryAccess) cfg.headers.Authorization = `Bearer ${memoryAccess}`;
  return cfg;
});

let refreshing: Promise<string | null> | null = null;
async function tryRefresh(): Promise<string | null> {
  const refresh = await tokens.getRefresh();
  if (!refresh) return null;
  if (!refreshing) {
    refreshing = axios
      .post(`${apiBaseUrl}/auth/refresh`, { refreshToken: refresh })
      .then(async (r) => {
        await tokens.set(r.data.accessToken, r.data.refreshToken);
        return r.data.accessToken as string;
      })
      .catch(async () => {
        await tokens.clear();
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & { __retry?: boolean };
    if (err.response?.status === 401 && original && !original.__retry) {
      original.__retry = true;
      const t = await tryRefresh();
      if (t) {
        original.headers.Authorization = `Bearer ${t}`;
        return api.request(original);
      }
    }
    throw err;
  },
);
