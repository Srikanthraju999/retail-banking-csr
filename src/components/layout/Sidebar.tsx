import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  FolderIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/cases/create', icon: PlusCircleIcon, label: 'Create' },
  { to: '/', icon: HomeIcon, label: 'Dashboard' },
  { to: '/cases', icon: FolderIcon, label: 'Cases' },
  { to: '/worklist', icon: ClipboardDocumentListIcon, label: 'Worklist' },
  { to: '/transactions', icon: ChartBarIcon, label: 'Analytics' },
];

const bottomItems = [
  { to: '/customers', icon: UsersIcon, label: 'Customers' },
  { to: '#settings', icon: Cog6ToothIcon, label: 'Settings' },
  { to: '#grid', icon: Squares2X2Icon, label: 'Grid' },
];

export function Sidebar() {
  return (
    <aside className="flex h-full w-16 flex-col items-center border-r border-gray-200 bg-white py-4">
      {/* Logo */}
      <div className="mb-6 flex h-10 w-10 items-center justify-center">
        <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none">
          <rect x="4" y="4" width="14" height="14" rx="2" fill="#E05A33" />
          <rect x="22" y="4" width="14" height="14" rx="2" fill="#E05A33" opacity="0.6" />
          <rect x="4" y="22" width="14" height="14" rx="2" fill="#E05A33" opacity="0.6" />
          <rect x="22" y="22" width="14" height="14" rx="2" fill="#E05A33" opacity="0.3" />
        </svg>
      </div>

      {/* Main nav */}
      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={item.label}
            className={({ isActive }) =>
              `flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
          </NavLink>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col items-center gap-2">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <item.icon className="h-5 w-5" />
          </NavLink>
        ))}

        {/* User avatar */}
        <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white">
          U
        </div>
      </div>
    </aside>
  );
}
