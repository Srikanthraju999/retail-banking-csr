import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorklist } from '../api/assignmentService';
import type { PegaAssignment } from '../types/pega.types';
import { Worklist } from '../components/assignments/Worklist';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';

export function WorklistPage() {
  const [assignments, setAssignments] = useState<PegaAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadWorklist();
  }, []);

  async function loadWorklist() {
    setLoading(true);
    setError(null);
    try {
      const data = await getWorklist();
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load worklist');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Worklist</h1>
        <button
          onClick={loadWorklist}
          disabled={loading}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading assignments..." />}
      {error && <ErrorAlert message={error} />}
      {!loading && !error && (
        <Worklist
          assignments={assignments}
          onSelect={(a) => navigate(`/worklist/${encodeURIComponent(a.ID)}`)}
        />
      )}
    </div>
  );
}
