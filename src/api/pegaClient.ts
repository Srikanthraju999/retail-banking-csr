import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { pegaConfig } from '../config/pega.config';

const pegaClient = axios.create({
  baseURL: pegaConfig.baseApiUrl,
  timeout: pegaConfig.http.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ETag store – tracks the latest ETag per assignment base URL for If-Match headers
const etagStore = new Map<string, string>();

/** Derive a cache key from a URL: use the decoded /assignments/{id} prefix */
function etagKey(url: string | undefined): string | undefined {
  if (!url) return undefined;
  // Decode so that %20 and raw spaces produce the same key
  let decoded: string;
  try { decoded = decodeURIComponent(url); } catch { decoded = url; }
  const match = decoded.match(/(\/assignments\/[^/]+)/);
  return match ? match[1] : undefined;
}

// Request interceptor – attach auth token + If-Match for PATCH
pegaClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const stored = sessionStorage.getItem('pega_tokens');
  if (stored) {
    const tokens = JSON.parse(stored);
    config.headers.Authorization = `${tokens.tokenType ?? 'Bearer'} ${tokens.accessToken}`;
  }

  // Attach If-Match header for PATCH requests (required by Pega DX API v2)
  if (config.method === 'patch') {
    const key = etagKey(config.url);
    if (key) {
      const etag = etagStore.get(key);
      if (etag) {
        config.headers['If-Match'] = etag;
      }
    }
  }

  return config;
});

// Response interceptor – handle 401 token refresh + capture ETags
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

pegaClient.interceptors.response.use(
  (response) => {
    // Capture ETag from response headers for future PATCH requests
    const etag = response.headers['etag'];
    if (etag) {
      const key = etagKey(response.config.url);
      if (key) {
        etagStore.set(key, etag);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(pegaClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const stored = sessionStorage.getItem('pega_tokens');
        if (!stored) throw new Error('No tokens available');

        const tokens = JSON.parse(stored);
        if (!tokens.refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${pegaConfig.serverUrl}${pegaConfig.oauth.tokenEndpoint}`,
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokens.refreshToken,
            client_id: pegaConfig.oauth.clientId,
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        );

        const newTokens = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? tokens.refreshToken,
          expiresIn: data.expires_in,
          tokenType: data.token_type ?? 'Bearer',
          expiresAt: Date.now() + data.expires_in * 1000,
        };

        sessionStorage.setItem('pega_tokens', JSON.stringify(newTokens));
        processQueue(null, newTokens.accessToken);

        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return pegaClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        sessionStorage.removeItem('pega_tokens');
        sessionStorage.removeItem('pega_operator');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default pegaClient;
