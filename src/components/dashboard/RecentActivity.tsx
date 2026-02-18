import type { PegaCaseHistoryEntry } from '../../types/pega.types';

interface RecentActivityProps {
  activities: PegaCaseHistoryEntry[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h3>
      {activities.length === 0 ? (
        <p className="text-sm text-gray-500">No recent activity</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((activity) => (
            <li key={activity.ID} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0">
              <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-800">{activity.message}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {activity.performer} &middot; {new Date(activity.performedDateTime).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
