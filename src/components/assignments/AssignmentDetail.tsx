import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignment, getAssignmentActions, performAssignment } from '../../api/assignmentService';
import type { PegaAssignment, PegaAssignmentAction } from '../../types/pega.types';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';

export function AssignmentDetail() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<PegaAssignment | null>(null);
  const [actions, setActions] = useState<PegaAssignmentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignmentId) return;
    loadAssignment();
  }, [assignmentId]);

  async function loadAssignment() {
    setLoading(true);
    setError(null);
    try {
      const id = decodeURIComponent(assignmentId!);
      const [a, acts] = await Promise.all([
        getAssignment(id),
        getAssignmentActions(id),
      ]);
      setAssignment(a);
      setActions(acts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(actionId: string) {
    if (!assignmentId) return;
    try {
      await performAssignment(decodeURIComponent(assignmentId), actionId);
      navigate('/worklist');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  }

  if (loading) return <LoadingSpinner message="Loading assignment..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!assignment) return <ErrorAlert message="Assignment not found" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/worklist')} className="text-sm text-blue-600 hover:underline">
            &larr; Back to Worklist
          </button>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{assignment.name}</h2>
          <p className="text-sm text-gray-500">Case: {assignment.caseID}</p>
        </div>
        <StatusBadge status={assignment.status} />
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        {assignment.instructions && (
          <div className="mb-6 rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">{assignment.instructions}</p>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
            <dd className="mt-1 text-sm text-gray-900">{assignment.assignedTo}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Routed To</dt>
            <dd className="mt-1 text-sm text-gray-900">{assignment.routedTo}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Urgency</dt>
            <dd className="mt-1 text-sm text-gray-900">{assignment.urgency}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">{new Date(assignment.createTime).toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      {actions.length > 0 && (
        <div className="flex gap-3">
          {actions.map((action) => (
            <button
              key={action.ID}
              onClick={() => handleAction(action.ID)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {action.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
