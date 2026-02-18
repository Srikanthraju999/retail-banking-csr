import pegaClient from './pegaClient';
import type { PegaAssignment, PegaAssignmentAction, PegaListResponse } from '../types/pega.types';

export async function getWorklist(): Promise<PegaAssignment[]> {
  const { data } = await pegaClient.get<PegaListResponse<PegaAssignment>>('/assignments');
  return data.pxResults ?? [];
}

export async function getAssignment(assignmentId: string): Promise<PegaAssignment> {
  const { data } = await pegaClient.get(`/assignments/${encodeURIComponent(assignmentId)}`);
  return data;
}

export async function performAssignment(
  assignmentId: string,
  actionId: string,
  content?: Record<string, unknown>,
): Promise<void> {
  await pegaClient.post(
    `/assignments/${encodeURIComponent(assignmentId)}/actions/${encodeURIComponent(actionId)}`,
    { content },
  );
}

export async function getAssignmentActions(assignmentId: string): Promise<PegaAssignmentAction[]> {
  const { data } = await pegaClient.get<PegaListResponse<PegaAssignmentAction>>(
    `/assignments/${encodeURIComponent(assignmentId)}/actions`,
  );
  return data.pxResults ?? [];
}
