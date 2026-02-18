// ── Pega DX API v2 Type Definitions ──

export interface PegaApiResponse<T = unknown> {
  pxObjClass: string;
  data: T;
}

export interface PegaListResponse<T> {
  pxObjClass: string;
  pxResults: T[];
  pxResultCount: number;
  totalCount?: number;
  nextPageToken?: string;
}

// ── Cases ──

export interface PegaCaseType {
  caseTypeID: string;
  name: string;
  description?: string;
  pxObjClass: string;
}

export interface PegaCase {
  ID: string;
  caseTypeID: string;
  name: string;
  status: string;
  statusWork: string;
  urgency: string;
  createTime: string;
  updateTime: string;
  owner: string;
  createdBy: string;
  lastUpdatedBy: string;
  stage?: string;
  content: Record<string, unknown>;
  associations?: PegaCaseAssociation[];
  nextAssignmentID?: string;
  assignments?: { ID: string }[];
}

export interface PegaCaseAssociation {
  ID: string;
  type: string;
  name: string;
}

export interface PegaCaseAction {
  ID: string;
  name: string;
  type: string;
  pxObjClass: string;
}

export interface PegaCaseHistoryEntry {
  ID: string;
  performer: string;
  performedBy: string;
  performedDateTime: string;
  message: string;
  eventType: string;
}

export interface CreateCasePayload {
  caseTypeID: string;
  content?: Record<string, unknown>;
  processID?: string;
}

// ── Assignments ──

export interface PegaAssignment {
  ID: string;
  caseID: string;
  name: string;
  instructions?: string;
  status: string;
  urgency: string;
  createTime: string;
  routedTo: string;
  assignedTo: string;
  canPerform: string;
  pxObjClass: string;
}

export interface PegaAssignmentAction {
  ID: string;
  name: string;
  type: string;
}

export interface PegaFieldGroup {
  name: string;
  type: string;
  visible: boolean;
  required?: boolean;
  readOnly?: boolean;
  value?: unknown;
  reference?: string;
  layout?: PegaFieldGroup[];
  fieldID?: string;
}

// ── Data Pages / Customer ──

export interface PegaDataPageResponse<T = Record<string, unknown>> {
  pxObjClass: string;
  pxResults: T[];
  pxResultCount: number;
}

export interface PegaCustomer {
  CustomerID: string;
  FirstName: string;
  LastName: string;
  FullName: string;
  Email: string;
  Phone: string;
  DateOfBirth: string;
  Address: PegaAddress;
  Segment: string;
  Status: string;
  CreatedDate: string;
}

export interface PegaAddress {
  Street: string;
  City: string;
  State: string;
  PostalCode: string;
  Country: string;
}

export interface PegaAccount {
  AccountID: string;
  AccountNumber: string;
  AccountType: string;
  AccountName: string;
  Balance: number;
  AvailableBalance: number;
  Currency: string;
  Status: string;
  OpenDate: string;
  CustomerID: string;
}

export interface PegaTransaction {
  TransactionID: string;
  AccountID: string;
  Date: string;
  Description: string;
  Amount: number;
  RunningBalance: number;
  Type: 'Credit' | 'Debit';
  Category: string;
  Reference: string;
  Status: string;
}

// ── Attachments ──

export interface PegaAttachment {
  ID: string;
  name: string;
  extension: string;
  mimeType: string;
  category: string;
  createTime: string;
  createdBy: string;
  size: number;
}

// ── Operator / Auth ──

export interface PegaOperator {
  operatorID: string;
  name: string;
  email: string;
  accessGroup: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  expiresAt: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  tokens: AuthTokens | null;
  operator: PegaOperator | null;
  loading: boolean;
  error: string | null;
}
