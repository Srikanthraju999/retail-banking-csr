import type { PegaCustomer } from '../../types/pega.types';
import { StatusBadge } from '../common/StatusBadge';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface CustomerProfileProps {
  customer: PegaCustomer;
}

export function CustomerProfile({ customer }: CustomerProfileProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <UserCircleIcon className="h-10 w-10 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{customer.FullName}</h2>
            <p className="text-sm text-gray-500">ID: {customer.CustomerID}</p>
          </div>
        </div>
        <StatusBadge status={customer.Status} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <EnvelopeIcon className="h-4 w-4" />
          <span>{customer.Email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <PhoneIcon className="h-4 w-4" />
          <span>{customer.Phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPinIcon className="h-4 w-4" />
          <span>
            {customer.Address.Street}, {customer.Address.City}, {customer.Address.State} {customer.Address.PostalCode}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Segment:</span>
          <span>{customer.Segment}</span>
        </div>
      </div>
    </div>
  );
}
