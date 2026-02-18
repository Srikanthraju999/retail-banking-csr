import type { PegaAssignment } from '../../types/pega.types';
import { StatusBadge } from '../common/StatusBadge';

interface WorklistProps {
  assignments: PegaAssignment[];
  onSelect: (assignment: PegaAssignment) => void;
}

export function Worklist({ assignments, onSelect }: WorklistProps) {
  if (assignments.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No pending assignments</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Assignment</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Case ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Urgency</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Assigned To</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {assignments.map((a) => (
            <tr key={a.ID} onClick={() => onSelect(a)} className="cursor-pointer hover:bg-blue-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600">{a.name}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{a.caseID}</td>
              <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={a.status} /></td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{a.urgency}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{a.assignedTo}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {new Date(a.createTime).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
