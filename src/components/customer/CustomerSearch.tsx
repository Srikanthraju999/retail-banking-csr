import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { searchCustomers } from '../../api/dataService';
import type { PegaCustomer } from '../../types/pega.types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';

interface CustomerSearchProps {
  onSelect: (customer: PegaCustomer) => void;
}

export function CustomerSearch({ onSelect }: CustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PegaCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const customers = await searchCustomers(query);
      setResults(customers);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID, or account number..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Search
        </button>
      </form>

      {error && <div className="mt-4"><ErrorAlert message={error} onDismiss={() => setError(null)} /></div>}
      {loading && <LoadingSpinner message="Searching customers..." />}

      {!loading && searched && results.length === 0 && (
        <p className="mt-6 text-center text-sm text-gray-500">No customers found</p>
      )}

      {results.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Customer ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Segment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {results.map((customer) => (
                <tr
                  key={customer.CustomerID}
                  onClick={() => onSelect(customer)}
                  className="cursor-pointer hover:bg-blue-50"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-blue-600">
                    {customer.CustomerID}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{customer.FullName}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{customer.Email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{customer.Phone}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{customer.Segment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
