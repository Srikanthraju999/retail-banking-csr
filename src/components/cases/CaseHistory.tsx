import type { PegaCaseHistoryEntry } from '../../types/pega.types';

interface CaseHistoryProps {
  entries: PegaCaseHistoryEntry[];
}

export function CaseHistory({ entries }: CaseHistoryProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">No history entries</p>;
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flow-root">
        <ul className="-mb-8">
          {entries.map((entry, idx) => (
            <li key={entry.ID}>
              <div className="relative pb-8">
                {idx < entries.length - 1 && (
                  <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" />
                )}
                <div className="relative flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 ring-8 ring-white">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm text-gray-900">{entry.message}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {entry.performer} &middot; {new Date(entry.performedDateTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
