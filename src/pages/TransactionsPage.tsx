import { useState } from 'react';
import { getTransactionHistory } from '../api/dataService';
import type { PegaTransaction } from '../types/pega.types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';

export function TransactionsPage() {
  const [accountId, setAccountId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactions, setTransactions] = useState<PegaTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const txns = await getTransactionHistory(
        accountId,
        startDate || undefined,
        endDate || undefined,
      );
      setTransactions(txns);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>

      <form onSubmit={handleSearch} className="rounded-lg bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700">
              Account ID
            </label>
            <input
              id="accountId"
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter account ID"
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {loading && <LoadingSpinner message="Loading transactions..." />}
      {error && <ErrorAlert message={error} />}

      {!loading && searched && transactions.length === 0 && (
        <p className="text-center text-sm text-gray-500">No transactions found</p>
      )}

      {transactions.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Reference</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {transactions.map((txn) => (
                <tr key={txn.TransactionID}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(txn.Date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{txn.Description}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{txn.Category}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{txn.Reference}</td>
                  <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${
                    txn.Type === 'Credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {txn.Type === 'Credit' ? '+' : '-'}
                    {Math.abs(txn.Amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                    {txn.RunningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
