import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCaseTypes, createCase } from '../api/caseService';
import type { PegaCaseType } from '../types/pega.types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';

export function CasesPage() {
  const [caseTypes, setCaseTypes] = useState<PegaCaseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCaseTypes();
  }, []);

  async function loadCaseTypes() {
    setLoading(true);
    setError(null);
    try {
      const types = await getCaseTypes();
      setCaseTypes(types);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case types');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(caseTypeID: string) {
    setCreatingId(caseTypeID);
    setError(null);
    try {
      const created = await createCase({ caseTypeID });
      const assignmentId =
        created.nextAssignmentID ?? created.assignments?.[0]?.ID;
      if (assignmentId) {
        navigate(`/worklist/${encodeURIComponent(assignmentId)}`);
      } else {
        navigate(`/cases/${encodeURIComponent(created.ID)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setCreatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Cases</h1>

      {loading && <LoadingSpinner message="Loading case types..." />}
      {error && <ErrorAlert message={error} />}

      {!loading && !error && caseTypes.length === 0 && (
        <p className="text-gray-500">No case types available.</p>
      )}

      {!loading && caseTypes.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {caseTypes.map((ct) => (
            <div
              key={ct.caseTypeID}
              className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {ct.name}
                </h2>
                {ct.description && (
                  <p className="mt-2 text-sm text-gray-500">
                    {ct.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleCreate(ct.caseTypeID)}
                disabled={creatingId === ct.caseTypeID}
                className="mt-6 w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingId === ct.caseTypeID ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
