import type { PegaAccount } from '../../types/pega.types';
import { StatusBadge } from '../common/StatusBadge';

interface AccountDetailsProps {
  accounts: PegaAccount[];
  onSelect?: (account: PegaAccount) => void;
}

export function AccountDetails({ accounts, onSelect }: AccountDetailsProps) {
  if (accounts.length === 0) {
    return <p className="text-sm text-gray-500">No accounts found</p>;
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <div
          key={account.AccountID}
          onClick={() => onSelect?.(account)}
          className={`rounded-lg border border-gray-200 bg-white p-4 ${onSelect ? 'cursor-pointer hover:border-blue-300' : ''}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{account.AccountName}</p>
              <p className="text-sm text-gray-500">{account.AccountType} &middot; {account.AccountNumber}</p>
            </div>
            <StatusBadge status={account.Status} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Balance</p>
              <p className="text-lg font-bold text-gray-900">
                {account.Currency} {account.Balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Available</p>
              <p className="text-lg font-bold text-green-600">
                {account.Currency} {account.AvailableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
