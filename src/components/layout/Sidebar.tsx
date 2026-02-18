import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', label: 'Dashboard', icon: HomeIcon },
  { to: '/customers', label: 'Customers', icon: UsersIcon },
  { to: '/cases', label: 'Cases', icon: FolderIcon },
  { to: '/worklist', label: 'Worklist', icon: ClipboardDocumentListIcon },
  { to: '/transactions', label: 'Transactions', icon: BanknotesIcon },
];

export function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6">
        <BanknotesIcon className="mr-3 h-8 w-8 text-blue-400" />
        <span className="text-lg font-bold">Retail Banking</span>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-700 px-6 py-4 text-xs text-gray-400">
        Pega DX API v2
      </div>
    </aside>
  );
}
