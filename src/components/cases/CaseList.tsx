import type { PegaCase } from '../../types/pega.types';
import { StatusBadge } from '../common/StatusBadge';

interface CaseListProps {
  cases: PegaCase[];
  onSelect: (c: PegaCase) => void;
}

export function CaseList({ cases, onSelect }: CaseListProps) {
  if (cases.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No cases found</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Case ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Urgency</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Owner</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {cases.map((c) => (
            <tr key={c.ID} onClick={() => onSelect(c)} className="cursor-pointer hover:bg-blue-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600">{c.ID}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{c.name}</td>
              <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={c.status} /></td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{c.urgency}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{c.owner}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {new Date(c.createTime).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
