import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCase } from '../../api/caseService';
import { getAttachments, uploadAttachment } from '../../api/attachmentService';
import type { PegaCase, PegaAttachment } from '../../types/pega.types';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';

export function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<PegaCase | null>(null);
  const [attachments, setAttachments] = useState<PegaAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'attachments'>('details');

  useEffect(() => {
    if (!caseId) return;
    loadCase();
  }, [caseId]);

  async function loadCase() {
    setLoading(true);
    setError(null);
    try {
      const id = decodeURIComponent(caseId!);
      const [c, att] = await Promise.all([
        getCase(id),
        getAttachments(id),
      ]);
      setCaseData(c);
      setAttachments(att);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!caseId || !e.target.files?.[0]) return;
    try {
      await uploadAttachment(decodeURIComponent(caseId), e.target.files[0]);
      const att = await getAttachments(decodeURIComponent(caseId));
      setAttachments(att);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  }

  if (loading) return <LoadingSpinner message="Loading case details..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!caseData) return <ErrorAlert message="Case not found" />;

  const tabs = [
    { key: 'details' as const, label: 'Details' },
    { key: 'attachments' as const, label: `Attachments (${attachments.length})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/cases')} className="text-sm text-blue-600 hover:underline">
            &larr; Back to Cases
          </button>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{caseData.name}</h2>
          <p className="text-sm text-gray-500">{caseData.ID}</p>
        </div>
        <StatusBadge status={caseData.status} />
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 text-sm font-medium ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'details' && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{caseData.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Urgency</dt>
              <dd className="mt-1 text-sm text-gray-900">{caseData.urgency}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Owner</dt>
              <dd className="mt-1 text-sm text-gray-900">{caseData.owner}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Stage</dt>
              <dd className="mt-1 text-sm text-gray-900">{caseData.stage ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(caseData.createTime).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(caseData.updateTime).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900">{caseData.createdBy}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated By</dt>
              <dd className="mt-1 text-sm text-gray-900">{caseData.lastUpdatedBy}</dd>
            </div>
          </dl>
        </div>
      )}

      {activeTab === 'attachments' && (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4">
            <label className="cursor-pointer rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              Upload File
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          {attachments.length === 0 ? (
            <p className="text-sm text-gray-500">No attachments</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {attachments.map((att) => (
                <li key={att.ID} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{att.name}</p>
                    <p className="text-xs text-gray-500">
                      {att.category} &middot; {(att.size / 1024).toFixed(1)} KB &middot; {new Date(att.createTime).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
