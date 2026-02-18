import axios from 'axios';
import pegaClient from './pegaClient';
import { pegaConfig } from '../config/pega.config';
import type { AuthTokens, PegaOperator } from '../types/pega.types';

export async function loginWithOAuth(username: string, password: string): Promise<AuthTokens> {
  const { data } = await axios.post(
    `${pegaConfig.serverUrl}${pegaConfig.oauth.tokenEndpoint}`,
    new URLSearchParams({
      grant_type: 'password',
      client_id: pegaConfig.oauth.clientId,
      client_secret: pegaConfig.oauth.clientSecret,
      username,
      password,
      scope: pegaConfig.oauth.scope,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type ?? 'Bearer',
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function loginWithBasicAuth(username: string, password: string): Promise<AuthTokens> {
  const encoded = btoa(`${username}:${password}`);
  return {
    accessToken: encoded,
    expiresIn: 0,
    tokenType: 'Basic',
    expiresAt: 0,
  };
}

export async function login(username: string, password: string): Promise<AuthTokens> {
  if (pegaConfig.authType === 'basic') {
    return loginWithBasicAuth(username, password);
  }
  return loginWithOAuth(username, password);
}

export async function refreshToken(currentRefreshToken: string): Promise<AuthTokens> {
  const { data } = await axios.post(
    `${pegaConfig.serverUrl}${pegaConfig.oauth.tokenEndpoint}`,
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: currentRefreshToken,
      client_id: pegaConfig.oauth.clientId,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? currentRefreshToken,
    expiresIn: data.expires_in,
    tokenType: data.token_type ?? 'Bearer',
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function getOperatorInfo(): Promise<PegaOperator> {
  const { data } = await pegaClient.get('/authenticate');
  return {
    operatorID: data.operatorID ?? data.pyUserIdentifier,
    name: data.operatorName ?? data.pyUserName ?? data.pyLabel,
    email: data.pyEmail ?? '',
    accessGroup: data.pyAccessGroup ?? '',
    roles: data.pyRoles ?? [],
  };
}

export function logout(): void {
  sessionStorage.removeItem('pega_tokens');
  sessionStorage.removeItem('pega_operator');
}
