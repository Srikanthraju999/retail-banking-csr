import pegaClient from './pegaClient';
import type {
  PegaCase,
  PegaCaseType,
  PegaCaseAction,
  PegaCaseHistoryEntry,
  PegaListResponse,
  CreateCasePayload,
} from '../types/pega.types';

export async function getCaseTypes(): Promise<PegaCaseType[]> {
  const { data } = await pegaClient.get<PegaListResponse<PegaCaseType>>('/casetypes');
  return data.pxResults ?? [];
}

export async function createCase(payload: CreateCasePayload): Promise<PegaCase> {
  const { data } = await pegaClient.post('/cases', payload);
  return data;
}

export async function getCase(caseId: string): Promise<PegaCase> {
  const { data } = await pegaClient.get(`/cases/${encodeURIComponent(caseId)}`);
  return data;
}

export async function updateCase(caseId: string, content: Record<string, unknown>, etag?: string): Promise<PegaCase> {
  const headers: Record<string, string> = {};
  if (etag) headers['If-Match'] = etag;
  const { data } = await pegaClient.put(`/cases/${encodeURIComponent(caseId)}`, { content }, { headers });
  return data;
}

export async function getCaseActions(caseId: string): Promise<PegaCaseAction[]> {
  const { data } = await pegaClient.get<PegaListResponse<PegaCaseAction>>(
    `/cases/${encodeURIComponent(caseId)}/actions`,
  );
  return data.pxResults ?? [];
}

export async function performAction(
  caseId: string,
  actionId: string,
  content?: Record<string, unknown>,
): Promise<void> {
  await pegaClient.post(`/cases/${encodeURIComponent(caseId)}/actions/${encodeURIComponent(actionId)}`, {
    content,
  });
}

export async function getCaseHistory(caseId: string): Promise<PegaCaseHistoryEntry[]> {
  const { data } = await pegaClient.get<PegaListResponse<PegaCaseHistoryEntry>>(
    `/cases/${encodeURIComponent(caseId)}/history`,
  );
  return data.pxResults ?? [];
}
