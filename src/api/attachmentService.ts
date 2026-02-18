import pegaClient from './pegaClient';
import type { PegaAttachment, PegaListResponse } from '../types/pega.types';

export async function getAttachments(caseId: string): Promise<PegaAttachment[]> {
  const { data } = await pegaClient.get<PegaListResponse<PegaAttachment>>(
    `/cases/${encodeURIComponent(caseId)}/attachments`,
  );
  return data.pxResults ?? [];
}

export async function uploadAttachment(
  caseId: string,
  file: File,
  category = 'File',
): Promise<PegaAttachment> {
  const formData = new FormData();
  formData.append('content', file);
  formData.append('category', category);
  formData.append('name', file.name);

  const { data } = await pegaClient.post(
    `/cases/${encodeURIComponent(caseId)}/attachments`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function downloadAttachment(
  caseId: string,
  attachmentId: string,
): Promise<Blob> {
  const { data } = await pegaClient.get(
    `/cases/${encodeURIComponent(caseId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { responseType: 'blob' },
  );
  return data;
}

export async function deleteAttachment(
  caseId: string,
  attachmentId: string,
): Promise<void> {
  await pegaClient.delete(
    `/cases/${encodeURIComponent(caseId)}/attachments/${encodeURIComponent(attachmentId)}`,
  );
}
