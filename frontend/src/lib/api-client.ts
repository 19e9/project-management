import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
});

let accessToken: string | null = null;
const ACCESS_KEY = 'planforge.access';
const REFRESH_KEY = 'planforge.refresh';

export const tokens = {
  load() {
    accessToken = localStorage.getItem(ACCESS_KEY);
    return {
      access: accessToken,
      refresh: localStorage.getItem(REFRESH_KEY),
    };
  },
  set(access: string, refresh: string) {
    accessToken = access;
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    accessToken = null;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  getAccess() {
    return accessToken ?? localStorage.getItem(ACCESS_KEY);
  },
  getRefresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
};

api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const t = tokens.getAccess();
  if (t) {
    cfg.headers.Authorization = `Bearer ${t}`;
  }
  return cfg;
});

let refreshing: Promise<string> | null = null;
async function tryRefresh(): Promise<string | null> {
  const refreshToken = tokens.getRefresh();
  if (!refreshToken) return null;
  if (!refreshing) {
    refreshing = axios
      .post(`${apiBaseUrl}/auth/refresh`, { refreshToken })
      .then((r) => {
        tokens.set(r.data.accessToken, r.data.refreshToken);
        return r.data.accessToken as string;
      })
      .catch(() => {
        tokens.clear();
        return '' as string;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  const t = await refreshing;
  return t || null;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { __retry?: boolean };
    if (error.response?.status === 401 && original && !original.__retry) {
      original.__retry = true;
      const newToken = await tryRefresh();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
    }
    return Promise.reject(error);
  },
);

export function googleLoginUrl() {
  return `${apiBaseUrl}/auth/google`;
}
