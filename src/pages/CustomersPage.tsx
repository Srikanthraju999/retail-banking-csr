import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerSearch } from '../components/customer/CustomerSearch';
import type { PegaCustomer } from '../types/pega.types';

export function CustomersPage() {
  const navigate = useNavigate();
  const [, setSelected] = useState<PegaCustomer | null>(null);

  function handleSelect(customer: PegaCustomer) {
    setSelected(customer);
    navigate(`/customers/${encodeURIComponent(customer.CustomerID)}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Customer Search</h1>
      <CustomerSearch onSelect={handleSelect} />
    </div>
  );
}
