import {
  ArrowRightOnRectangleIcon,
  MoonIcon,
  Cog6ToothIcon,
  Bars3Icon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/customers': 'Customers',
  '/cases': 'Cases',
  '/cases/create': 'Create Case',
  '/worklist': 'Worklist',
  '/transactions': 'Transactions',
};

export function Header() {
  const { operator, logout } = useAuth();
  const location = useLocation();

  // Derive page title from route
  let pageTitle = routeTitles[location.pathname] || '';
  if (!pageTitle && location.pathname.startsWith('/worklist/')) pageTitle = 'Quotation';
  if (!pageTitle && location.pathname.startsWith('/cases/')) pageTitle = 'Case Details';
  if (!pageTitle && location.pathname.startsWith('/customers/')) pageTitle = 'Customer Details';

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Left: Page title */}
      <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* Language selector */}
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100">
          <GlobeAltIcon className="h-4 w-4" />
          <span>EN</span>
        </button>

        {/* Dark mode toggle */}
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <MoonIcon className="h-5 w-5" />
        </button>

        {/* Settings */}
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <Cog6ToothIcon className="h-5 w-5" />
        </button>

        {/* Menu */}
        <button className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <Bars3Icon className="h-5 w-5" />
        </button>

        {/* User avatar + logout */}
        <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white">
            {operator?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-red-500"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
