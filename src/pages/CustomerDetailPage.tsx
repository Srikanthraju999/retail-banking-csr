import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomerDetails, getAccountList, getTransactionHistory } from '../api/dataService';
import type { PegaCustomer, PegaAccount, PegaTransaction } from '../types/pega.types';
import { CustomerProfile } from '../components/customer/CustomerProfile';
import { AccountDetails } from '../components/customer/AccountDetails';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<PegaCustomer | null>(null);
  const [accounts, setAccounts] = useState<PegaAccount[]>([]);
  const [transactions, setTransactions] = useState<PegaTransaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PegaAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    loadCustomer();
  }, [customerId]);

  async function loadCustomer() {
    setLoading(true);
    setError(null);
    try {
      const id = decodeURIComponent(customerId!);
      const [cust, accts] = await Promise.all([
        getCustomerDetails(id),
        getAccountList(id),
      ]);
      setCustomer(cust);
      setAccounts(accts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccountSelect(account: PegaAccount) {
    setSelectedAccount(account);
    try {
      const txns = await getTransactionHistory(account.AccountID);
      setTransactions(txns);
    } catch {
      setTransactions([]);
    }
  }

  if (loading) return <LoadingSpinner message="Loading customer..." />;
  if (error) return <ErrorAlert message={error} />;
  if (!customer) return <ErrorAlert message="Customer not found" />;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/customers')} className="text-sm text-blue-600 hover:underline">
        &larr; Back to Search
      </button>

      <CustomerProfile customer={customer} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Accounts</h3>
          <AccountDetails accounts={accounts} onSelect={handleAccountSelect} />
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">
            {selectedAccount
              ? `Transactions - ${selectedAccount.AccountName}`
              : 'Select an account to view transactions'}
          </h3>
          {selectedAccount && transactions.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {transactions.map((txn) => (
                    <tr key={txn.TransactionID}>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
                        {new Date(txn.Date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{txn.Description}</td>
                      <td className={`whitespace-nowrap px-4 py-2 text-right text-sm font-medium ${
                        txn.Type === 'Credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.Type === 'Credit' ? '+' : '-'}
                        {Math.abs(txn.Amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : selectedAccount ? (
            <p className="text-sm text-gray-500">No transactions found</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
