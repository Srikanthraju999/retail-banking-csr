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

export async function getAssignmentActionView(
  assignmentId: string,
  actionId: string,
): Promise<Record<string, unknown>> {
  const { data } = await pegaClient.get(
    `/assignments/${encodeURIComponent(assignmentId)}/actions/${encodeURIComponent(actionId)}`,
  );
  return data;
}

/** Submit assignment action via PATCH (DX API v2). Uses the action's href when provided. */
export async function submitAssignment(
  href: string,
  content?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data } = await pegaClient.patch(href, { content });
  return data;
}

/** Save assignment action via PATCH on the save href. */
export async function saveAssignment(
  href: string,
  content?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data } = await pegaClient.patch(href, { content });
  return data;
}

/** Open (GET) an assignment action view using a direct href. */
export async function openAssignmentActionByHref(
  href: string,
): Promise<Record<string, unknown>> {
  const { data } = await pegaClient.get(href);
  return data;
}

/** Fallback: submit assignment using constructed URL with PATCH. */
export async function performAssignment(
  assignmentId: string,
  actionId: string,
  content?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data } = await pegaClient.patch(
    `/assignments/${encodeURIComponent(assignmentId)}/actions/${encodeURIComponent(actionId)}`,
    { content },
  );
  return data;
}

export async function getAssignmentActions(assignmentId: string): Promise<PegaAssignmentAction[]> {
  const { data } = await pegaClient.get<PegaListResponse<PegaAssignmentAction>>(
    `/assignments/${encodeURIComponent(assignmentId)}/actions`,
  );
  return data.pxResults ?? [];
}
