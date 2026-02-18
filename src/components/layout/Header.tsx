import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { operator, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">Customer Service Portal</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserCircleIcon className="h-6 w-6" />
          <span>{operator?.name ?? 'Agent'}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
