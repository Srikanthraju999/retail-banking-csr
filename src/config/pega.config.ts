export interface PegaConfig {
  serverUrl: string;
  contextRoot: string;
  apiVersion: string;
  appAlias: string;
  baseApiUrl: string;

  authType: 'oauth2' | 'basic';
  oauth: {
    clientId: string;
    clientSecret: string;
    grantType: string;
    tokenEndpoint: string;
    authorizeEndpoint: string;
    redirectUri: string;
    scope: string;
  };

  application: {
    name: string;
    version: string;
    accessGroup: string;
  };

  http: {
    timeout: number;
    maxRetries: number;
  };
}

function getEnv(key: string, fallback = ''): string {
  return (import.meta.env[key] ?? fallback).trim();
}

function buildBaseApiUrl(serverUrl: string, contextRoot: string, apiVersion: string): string {
  const base = serverUrl.trim().replace(/\/+$/, '');
  const root = contextRoot.trim().replace(/\/+$/, '');
  return `${base}${root}/api/application/${apiVersion}`;
}

export function getPegaConfig(): PegaConfig {
  const serverUrl = getEnv('VITE_PEGA_SERVER_URL');
  const contextRoot = getEnv('VITE_PEGA_CONTEXT_ROOT', '/prweb');
  const apiVersion = getEnv('VITE_PEGA_API_VERSION', 'v2');
  const appAlias = getEnv('VITE_PEGA_APP_ALIAS');

  return {
    serverUrl,
    contextRoot,
    apiVersion,
    appAlias,
    baseApiUrl: buildBaseApiUrl(serverUrl, contextRoot, apiVersion),

    authType: getEnv('VITE_PEGA_AUTH_TYPE', 'oauth2') as 'oauth2' | 'basic',
    oauth: {
      clientId: getEnv('VITE_PEGA_OAUTH_CLIENT_ID'),
      clientSecret: getEnv('VITE_PEGA_OAUTH_CLIENT_SECRET'),
      grantType: getEnv('VITE_PEGA_OAUTH_GRANT_TYPE', 'client_credentials'),
      tokenEndpoint: getEnv('VITE_PEGA_OAUTH_TOKEN_ENDPOINT', '/prweb/PRRestService/oauth2/v1/token'),
      authorizeEndpoint: getEnv('VITE_PEGA_OAUTH_AUTHORIZE_ENDPOINT', '/prweb/PRRestService/oauth2/v1/authorize'),
      redirectUri: getEnv('VITE_PEGA_OAUTH_REDIRECT_URI', 'http://localhost:5173/auth/callback'),
      scope: getEnv('VITE_PEGA_OAUTH_SCOPE'),
    },

    application: {
      name: getEnv('VITE_PEGA_APPLICATION_NAME', 'RetailBanking'),
      version: getEnv('VITE_PEGA_APPLICATION_VERSION', '01.01.01'),
      accessGroup: getEnv('VITE_PEGA_ACCESS_GROUP'),
    },

    http: {
      timeout: Number(getEnv('VITE_PEGA_TIMEOUT', '30000')),
      maxRetries: Number(getEnv('VITE_PEGA_MAX_RETRIES', '3')),
    },
  };
}

export const pegaConfig = getPegaConfig();
