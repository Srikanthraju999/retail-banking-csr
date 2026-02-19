import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCaseTypes, createCase } from '../../api/caseService';
import type { PegaCaseType } from '../../types/pega.types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';

export function CreateCase() {
  const navigate = useNavigate();
  const [caseTypes, setCaseTypes] = useState<PegaCaseType[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCaseTypes();
  }, []);

  async function loadCaseTypes() {
    try {
      const types = await getCaseTypes();
      setCaseTypes(types);
      if (types.length > 0) setSelectedType(types[0].ID ?? types[0].caseTypeID ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case types');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType) return;

    setSubmitting(true);
    setError(null);
    try {
      const newCase = await createCase({ caseTypeID: selectedType });
      const caseId = (newCase.ID as string) ?? '';
      navigate(`/cases/${encodeURIComponent(caseId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading case types..." />;

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Create New Case</h2>

      {error && <div className="mb-4"><ErrorAlert message={error} onDismiss={() => setError(null)} /></div>}

      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-6">
          <label htmlFor="caseType" className="block text-sm font-medium text-gray-700">
            Case Type
          </label>
          <select
            id="caseType"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {caseTypes.map((ct) => {
              const id = ct.ID ?? ct.caseTypeID ?? '';
              return (
                <option key={id} value={id}>
                  {ct.name}
                </option>
              );
            })}
          </select>
          {caseTypes.find((ct) => (ct.ID ?? ct.caseTypeID) === selectedType)?.description && (
            <p className="mt-1 text-xs text-gray-500">
              {caseTypes.find((ct) => (ct.ID ?? ct.caseTypeID) === selectedType)?.description}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedType}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Case'}
          </button>
        </div>
      </form>
    </div>
  );
}
