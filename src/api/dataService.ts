import pegaClient from './pegaClient';
import type {
  PegaCustomer,
  PegaAccount,
  PegaTransaction,
  PegaDataPageResponse,
} from '../types/pega.types';

export async function getDataPage<T = Record<string, unknown>>(
  dataPageId: string,
  params?: Record<string, string>,
): Promise<PegaDataPageResponse<T>> {
  const { data } = await pegaClient.get(`/data/${encodeURIComponent(dataPageId)}`, { params });
  return data;
}

export async function searchCustomers(query: string): Promise<PegaCustomer[]> {
  const { data } = await pegaClient.get<PegaDataPageResponse<PegaCustomer>>(
    '/data/D_CustomerSearch',
    { params: { SearchText: query } },
  );
  return data.pxResults ?? [];
}

export async function getCustomerDetails(customerId: string): Promise<PegaCustomer> {
  const { data } = await pegaClient.get<PegaDataPageResponse<PegaCustomer>>(
    '/data/D_Customer',
    { params: { CustomerID: customerId } },
  );
  return data.pxResults?.[0] ?? (data as unknown as PegaCustomer);
}

export async function getAccountList(customerId: string): Promise<PegaAccount[]> {
  const { data } = await pegaClient.get<PegaDataPageResponse<PegaAccount>>(
    '/data/D_AccountList',
    { params: { CustomerID: customerId } },
  );
  return data.pxResults ?? [];
}

export async function getAccountDetails(accountId: string): Promise<PegaAccount> {
  const { data } = await pegaClient.get<PegaDataPageResponse<PegaAccount>>(
    '/data/D_Account',
    { params: { AccountID: accountId } },
  );
  return data.pxResults?.[0] ?? (data as unknown as PegaAccount);
}

export async function getTransactionHistory(
  accountId: string,
  startDate?: string,
  endDate?: string,
): Promise<PegaTransaction[]> {
  const params: Record<string, string> = { AccountID: accountId };
  if (startDate) params.StartDate = startDate;
  if (endDate) params.EndDate = endDate;

  const { data } = await pegaClient.get<PegaDataPageResponse<PegaTransaction>>(
    '/data/D_TransactionHistory',
    { params },
  );
  return data.pxResults ?? [];
}
