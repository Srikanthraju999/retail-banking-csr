import { useEffect, useState } from 'react';
import {
  FolderIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { getWorklist } from '../api/assignmentService';
import type { PegaAssignment } from '../types/pega.types';
import { KpiCard } from '../components/dashboard/KpiCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const [assignments, setAssignments] = useState<PegaAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const worklist = await getWorklist();
      setAssignments(worklist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorAlert message={error} />;

  const urgentCount = assignments.filter((a) => Number(a.urgency) >= 10).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Pending Assignments" value={assignments.length} icon={ClipboardDocumentListIcon} color="blue" />
        <KpiCard title="Urgent Items" value={urgentCount} icon={ExclamationCircleIcon} color="red" />
        <KpiCard title="Open Cases" value="--" icon={FolderIcon} color="green" />
        <KpiCard title="Customers Served" value="--" icon={UserGroupIcon} color="yellow" />
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">My Worklist</h3>
        {assignments.length === 0 ? (
          <p className="text-sm text-gray-500">No pending assignments</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Assignment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Case</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Urgency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {assignments.slice(0, 5).map((a) => (
                  <tr
                    key={a.ID}
                    onClick={() => navigate(`/worklist/${encodeURIComponent(a.ID)}`)}
                    className="cursor-pointer hover:bg-blue-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600">{a.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{a.caseID}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{a.urgency}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(a.createTime).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
