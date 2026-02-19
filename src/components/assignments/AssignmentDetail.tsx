import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  getAssignment,
  getAssignmentActionView,
  submitAssignment,
  performAssignment,
  openAssignmentActionByHref,
} from '../../api/assignmentService';
import { getDataPage } from '../../api/dataService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { ChevronDownIcon, ChevronRightIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';

// ── Types ──

interface FieldDataSource {
  name: string;
  keyField: string;
  textField: string;
}

interface FormField {
  fieldID: string;
  label: string;
  value: string;
  type: string;
  required: boolean;
  readOnly: boolean;
  disabled: boolean;
  reference: string;
  maxLength?: number;
  controlType: string;
  options: { key: string; value: string }[];
  datasource?: FieldDataSource;
  groupName?: string;
}

interface StageInfo {
  ID: string;
  name: string;
  visited_status: string;
  type: string;
}

interface ActionInfo {
  ID: string;
  name: string;
  submitHref: string;
  saveHref: string;
  openHref: string;
}

interface NavigationStep {
  ID: string;
  name: string;
  actionID: string;
  visited_status: string;
  openHref: string;
}

interface ActionButtonInfo {
  name: string;
  actionID: string;
  jsAction: string;
}

interface AssignmentPageData {
  assignmentId: string;
  assignmentName: string;
  caseId: string;
  caseName: string;
  status: string;
  urgency: string;
  owner: string;
  createdBy: string;
  createTime: string;
  stageLabel: string;
  stages: StageInfo[];
  actions: ActionInfo[];
  instructions: string;
  navigationSteps: NavigationStep[];
  mainButtons: ActionButtonInfo[];
  secondaryButtons: ActionButtonInfo[];
}

// ── Helpers ──

function str(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

function extractPageData(navState: Record<string, unknown> | null, assignmentId: string): AssignmentPageData {
  const defaults: AssignmentPageData = {
    assignmentId,
    assignmentName: 'Assignment',
    caseId: '',
    caseName: '',
    status: '',
    urgency: '',
    owner: '',
    createdBy: '',
    createTime: '',
    stageLabel: '',
    stages: [],
    actions: [],
    instructions: '',
    navigationSteps: [],
    mainButtons: [],
    secondaryButtons: [],
  };

  if (!navState) return defaults;

  const data = navState.data as Record<string, unknown> | undefined;
  const ci = (data?.caseInfo ?? navState) as Record<string, unknown>;

  const assignments = ci.assignments as Array<Record<string, unknown>> | undefined;
  const firstAsgn = assignments?.[0];
  const asgnActions = firstAsgn?.actions as Array<Record<string, unknown>> | undefined;

  const rawStages = ci.stages as Array<Record<string, unknown>> | undefined;
  const stages: StageInfo[] = (rawStages ?? []).map((s) => ({
    ID: str(s.ID),
    name: str(s.name),
    visited_status: str(s.visited_status),
    type: str(s.type),
  }));

  const actions: ActionInfo[] = (asgnActions ?? []).map((a) => {
    const links = a.links as Record<string, Record<string, unknown>> | undefined;
    return {
      ID: str(a.ID),
      name: str(a.name),
      submitHref: str(links?.submit?.href),
      saveHref: str(links?.save?.href),
      openHref: str(links?.open?.href),
    };
  });

  const uiResources = navState.uiResources as Record<string, unknown> | undefined;
  const navigation = uiResources?.navigation as Record<string, unknown> | undefined;
  const rawSteps = navigation?.steps as Array<Record<string, unknown>> | undefined;
  const navigationSteps: NavigationStep[] = (rawSteps ?? []).map((s) => {
    const stepLinks = s.links as Record<string, Record<string, unknown>> | undefined;
    return {
      ID: str(s.ID),
      name: str(s.name),
      actionID: str(s.actionID),
      visited_status: str(s.visited_status),
      openHref: str(stepLinks?.open?.href),
    };
  });

  const actionButtons = uiResources?.actionButtons as Record<string, unknown> | undefined;
  const mainBtns = (actionButtons?.main as Array<Record<string, unknown>> | undefined) ?? [];
  const secondaryBtns = (actionButtons?.secondary as Array<Record<string, unknown>> | undefined) ?? [];

  const mainButtons: ActionButtonInfo[] = mainBtns.map((b) => ({
    name: str(b.name).trim(),
    actionID: str(b.actionID),
    jsAction: str(b.jsAction),
  }));
  const secondaryButtons: ActionButtonInfo[] = secondaryBtns.map((b) => ({
    name: str(b.name).trim(),
    actionID: str(b.actionID),
    jsAction: str(b.jsAction),
  }));

  return {
    assignmentId: str(firstAsgn?.ID) || assignmentId,
    assignmentName: str(firstAsgn?.name) || str(ci.name) || 'Assignment',
    caseId: str(ci.ID) || str(navState.ID) || '',
    caseName: str(ci.name) || str(ci.caseTypeName) || '',
    status: str(ci.status),
    urgency: str(ci.urgency) || str(firstAsgn?.urgency),
    owner: str(ci.owner),
    createdBy: str(ci.createdBy),
    createTime: str(ci.createTime),
    stageLabel: str(ci.stageLabel),
    stages,
    actions,
    instructions: str(firstAsgn?.instructions),
    navigationSteps,
    mainButtons,
    secondaryButtons,
  };
}

// ── Field extraction ──

function extractFields(obj: unknown, prefix = ''): FormField[] {
  const fields: FormField[] = [];
  if (!obj || typeof obj !== 'object') return fields;

  const node = obj as Record<string, unknown>;

  if (node.fieldID && typeof node.fieldID === 'string') {
    const control = node.control as Record<string, unknown> | undefined;
    const controlType = (control?.type as string) ?? 'pxTextInput';
    const modes = (control?.modes as Array<Record<string, unknown>>) ?? [];
    let options: { key: string; value: string }[] = [];
    for (const mode of modes) {
      const ds = mode.datasource as Record<string, unknown> | undefined;
      if (ds?.records && Array.isArray(ds.records)) {
        options = (ds.records as Array<Record<string, string>>).map((r) => ({
          key: r.key ?? r.value ?? '',
          value: r.value ?? r.key ?? '',
        }));
      }
      if (options.length === 0) {
        const recs = (mode.options as Array<Record<string, string>>) ?? [];
        if (recs.length > 0) {
          options = recs.map((r) => ({ key: r.key ?? r.value ?? '', value: r.value ?? r.key ?? '' }));
        }
      }
    }
    const ref = (node.reference as string) ?? prefix;
    fields.push({
      fieldID: node.fieldID as string,
      label: (node.label as string) ?? (node.name as string) ?? (node.fieldID as string),
      value: (node.value as string) ?? '',
      type: (node.type as string) ?? 'Text',
      required: (node.required as boolean) ?? false,
      readOnly: (node.readOnly as boolean) ?? false,
      disabled: (node.disabled as boolean) ?? false,
      reference: ref,
      maxLength: node.maxLength as number | undefined,
      controlType,
      options,
    });
    return fields;
  }

  for (const key of ['groups', 'layout', 'view', 'field', 'fields']) {
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) fields.push(...extractFields(item, prefix));
    } else if (child && typeof child === 'object') {
      fields.push(...extractFields(child, prefix));
    }
  }
  return fields;
}

// ── uiResources-based field extraction (DX API v2) ──

const FIELD_COMPONENT_TYPES = new Set([
  'TextInput', 'TextArea', 'Dropdown', 'Checkbox', 'RadioButtons',
  'DateInput', 'DateTime', 'NumberInput', 'Email', 'Phone',
  'Currency', 'URL', 'AutoComplete', 'RichText',
]);

function mapComponentToControl(componentType: string): string {
  const map: Record<string, string> = {
    TextInput: 'pxTextInput', TextArea: 'pxTextArea', Dropdown: 'pxDropdown',
    Checkbox: 'pxCheckbox', RadioButtons: 'pxRadioButtons', DateInput: 'pxDateTime',
    DateTime: 'pxDateTime', NumberInput: 'pxNumber', Email: 'pxEmail',
    Phone: 'pxPhone', Currency: 'pxCurrency', AutoComplete: 'pxAutoComplete', URL: 'pxURL',
  };
  return map[componentType] || 'pxTextInput';
}

function resolvePropertyRef(ref: string): string | undefined {
  const match = ref.match(/@[A-Z]+\s+\.(\w+)/);
  if (match) return match[1];
  if (ref.startsWith('.')) return ref.slice(1);
  return undefined;
}

function extractFieldsFromUiResources(response: Record<string, unknown>): FormField[] {
  const uiResources = response.uiResources as Record<string, unknown> | undefined;
  if (!uiResources) return [];

  const resources = uiResources.resources as Record<string, unknown> | undefined;
  if (!resources) return [];

  const views = resources.views as Record<string, unknown[]> | undefined;
  const fieldsMeta = resources.fields as Record<string, unknown[]> | undefined;
  if (!views) return [];

  const data = response.data as Record<string, unknown> | undefined;
  const caseInfo = data?.caseInfo as Record<string, unknown> | undefined;
  const content = caseInfo?.content as Record<string, unknown> | undefined;

  const fields: FormField[] = [];
  const visited = new Set<string>();
  let currentGroupName = '';

  function traverseNode(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    const type = n.type as string | undefined;
    const config = n.config as Record<string, unknown> | undefined;

    // Track group/region names for collapsible sections
    if (type === 'Region' || type === 'Group') {
      const heading = config?.heading as string | undefined;
      const title = config?.title as string | undefined;
      const label = config?.label as string | undefined;
      if (heading || title || label) {
        currentGroupName = heading || title || label || '';
      }
    }

    if (type === 'reference' && config?.type === 'view') {
      let viewName = config.name as string | undefined;
      // Track view name as potential group name
      if (viewName && !viewName.includes('@')) {
        const cleanName = viewName.replace(/^.*\./, '').replace(/([A-Z])/g, ' $1').trim();
        if (cleanName && cleanName.length > 2) {
          currentGroupName = cleanName;
        }
      }
      if (viewName?.includes('@')) {
        const propName = resolvePropertyRef(viewName);
        if (propName && content) {
          viewName = content[propName] as string | undefined;
        }
      }
      if (viewName && !visited.has(viewName) && views?.[viewName]) {
        visited.add(viewName);
        const viewDef = (views?.[viewName] as unknown[])[0];
        if (viewDef) traverseNode(viewDef);
      }
      return;
    }

    if (type && FIELD_COMPONENT_TYPES.has(type) && config) {
      const valueRef = config.value as string | undefined;
      if (valueRef) {
        const fieldName = resolvePropertyRef(valueRef);
        if (fieldName) {
          const metaArr = fieldsMeta?.[fieldName] as unknown[] | undefined;
          const meta = metaArr?.[0] as Record<string, unknown> | undefined;

          let label = fieldName;
          const labelRef = config.label as string | undefined;
          if (labelRef) {
            if (labelRef.startsWith('@')) {
              label = (meta?.label as string) || fieldName;
            } else {
              label = labelRef;
            }
          }

          let options: { key: string; value: string }[] = [];
          const listSource = config.datasource as Record<string, unknown> | undefined;
          if (listSource?.records && Array.isArray(listSource.records)) {
            options = (listSource.records as Array<Record<string, string>>).map((r) => ({
              key: r.key ?? r.value ?? '',
              value: r.value ?? r.key ?? '',
            }));
          }

          let datasource: FieldDataSource | undefined;
          if (listSource?.source && typeof listSource.source === 'string') {
            const dsMatch = (listSource.source as string).match(/@DATASOURCE\s+([\w-]+)/);
            if (dsMatch) {
              const dsFields = listSource.fields as Record<string, string> | undefined;
              datasource = {
                name: dsMatch[1],
                keyField: dsFields?.key || 'pyGUID',
                textField: dsFields?.text || dsFields?.value || '',
              };
            }
          }

          if (!datasource && meta?.dataRetrievalType === 'refer') {
            const metaDs = meta.datasource as Record<string, unknown> | undefined;
            const dsName = metaDs?.name as string | undefined;
            if (dsName) {
              datasource = {
                name: dsName,
                keyField: 'pyGUID',
                textField: '',
              };
            }
          }

          fields.push({
            fieldID: fieldName,
            label,
            value: content ? String(content[fieldName] ?? '') : '',
            type: (meta?.type as string) || 'Text',
            required: (config.required as boolean) ?? false,
            readOnly: (config.readOnly as boolean) ?? false,
            disabled: (config.disabled as boolean) ?? false,
            reference: `.${fieldName}`,
            maxLength: (meta?.maxLength as number) ?? undefined,
            controlType: (meta?.displayAs as string) || mapComponentToControl(type),
            options,
            datasource,
            groupName: currentGroupName || 'Details',
          });
        }
      }
    }

    const children = n.children as unknown[] | undefined;
    if (children) {
      for (const child of children) traverseNode(child);
    }
  }

  const root = uiResources.root as Record<string, unknown> | undefined;
  if (root) {
    traverseNode(root);
  }

  if (fields.length === 0) {
    for (const viewName of Object.keys(views)) {
      if (viewName === 'pzCreateDetails') continue;
      if (visited.has(viewName)) continue;
      visited.add(viewName);
      const viewDef = (views[viewName] as unknown[])?.[0];
      if (viewDef) traverseNode(viewDef);
    }
  }

  return fields;
}

// ── Resolve refer-type data sources ──

const SYSTEM_FIELDS = new Set([
  'pyGUID', 'pxObjClass', 'pxCreateDateTime', 'pxUpdateDateTime',
  'pxCreateOperator', 'pxUpdateOperator', 'pxSaveDateTime',
  'pxCreateSystemID', 'pxInsName', 'pxCommitDateTime', 'pzInsKey',
  'pxSaveDateTimeStamp', 'pxPages',
]);

function pickDisplayField(record: Record<string, unknown>): string {
  for (const [key, val] of Object.entries(record)) {
    if (SYSTEM_FIELDS.has(key)) continue;
    if (key.startsWith('px') || key.startsWith('pz')) continue;
    if (typeof val === 'string' && val.length > 0) return key;
  }
  return 'pyGUID';
}

async function resolveDataSources(fields: FormField[]): Promise<FormField[]> {
  const referFields = fields.filter((f) => f.datasource?.name && f.options.length === 0);
  if (referFields.length === 0) return fields;

  const byDs = new Map<string, FormField[]>();
  for (const f of referFields) {
    const name = f.datasource!.name;
    if (!byDs.has(name)) byDs.set(name, []);
    byDs.get(name)!.push(f);
  }

  await Promise.all(
    Array.from(byDs.entries()).map(async ([dsName, dsFields]) => {
      try {
        const resp = await getDataPage(dsName);
        const records = (resp.pxResults ?? []) as Array<Record<string, unknown>>;
        if (records.length === 0) return;

        const keyField = dsFields[0].datasource!.keyField || 'pyGUID';
        let textField = dsFields[0].datasource!.textField;
        if (!textField) textField = pickDisplayField(records[0]);

        const options = records.map((r) => ({
          key: String(r[keyField] ?? ''),
          value: String(r[textField] ?? r[keyField] ?? ''),
        }));

        for (const f of dsFields) {
          f.options = options;
          f.controlType = 'pxDropdown';
        }
      } catch {
        // Data source fetch failed
      }
    }),
  );

  return fields;
}

// ── Field rendering ──

function FieldInput({ field, value, onChange }: { field: FormField; value: string; onChange: (val: string) => void }) {
  const base = 'mt-1 block w-full rounded border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:bg-gray-100 disabled:text-gray-400';

  if (field.readOnly || field.disabled) {
    return <input type="text" value={value} disabled className={base} />;
  }

  const ct = field.controlType.toLowerCase();

  if (ct.includes('dropdown') || ct.includes('select') || field.options.length > 0) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} required={field.required} className={base}>
        <option value="">-- Select --</option>
        {field.options.map((opt) => <option key={opt.key} value={opt.key}>{opt.value}</option>)}
      </select>
    );
  }
  if (ct.includes('textarea')) {
    return <textarea value={value} onChange={(e) => onChange(e.target.value)} required={field.required} maxLength={field.maxLength} rows={3} className={base} />;
  }
  if (ct.includes('checkbox') || field.type.toLowerCase() === 'boolean') {
    return <input type="checkbox" checked={value === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : 'false')} className="mt-2 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />;
  }
  if (ct.includes('date') || field.type.toLowerCase().includes('date')) {
    return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} required={field.required} className={base} />;
  }
  if (ct.includes('number') || ct.includes('integer') || ct.includes('currency')) {
    return <input type="number" value={value} onChange={(e) => onChange(e.target.value)} required={field.required} className={base} />;
  }
  if (ct.includes('email')) {
    return <input type="email" value={value} onChange={(e) => onChange(e.target.value)} required={field.required} maxLength={field.maxLength} className={base} />;
  }
  if (ct.includes('phone') || ct.includes('tel')) {
    return <input type="tel" value={value} onChange={(e) => onChange(e.target.value)} required={field.required} maxLength={field.maxLength} className={base} />;
  }
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} required={field.required} maxLength={field.maxLength} className={base} />;
}

// ── Case Header Bar ──

function CaseHeaderBar({ pageData }: { pageData: AssignmentPageData }) {
  const startDate = pageData.createTime
    ? new Date(pageData.createTime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-6 py-4">
      <div className="text-base font-semibold text-gray-800">
        Case ID - {pageData.caseId.replace(/.*-/, '') || pageData.caseId}
      </div>
      <div className="flex items-center gap-8">
        <div className="text-center">
          <div className="text-xs font-medium text-gray-400">Status</div>
          <div className="text-sm font-semibold text-gray-700">{pageData.status || 'New'}</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-medium text-gray-400">Start Date</div>
          <div className="text-sm font-semibold text-gray-700">{startDate}</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-medium text-gray-400">Customer ID</div>
          <div className="text-sm font-semibold text-gray-700">{pageData.owner || '-'}</div>
        </div>
        <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <UserIcon className="h-4 w-4" />
            <span>{pageData.createdBy || pageData.owner || 'Customer'}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4" />
            <span>-</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stage Chevron Bar ──

function StageChevronBar({ stages, currentStageLabel }: { stages: StageInfo[]; currentStageLabel: string }) {
  const primary = stages.filter((s) => s.type === 'Primary');
  if (primary.length === 0) return null;

  return (
    <div className="flex items-center gap-0">
      {primary.map((stage, idx) => {
        const isActive = stage.visited_status === 'active' || stage.name === currentStageLabel;
        const isVisited = stage.visited_status === 'visited';
        return (
          <div
            key={stage.ID}
            className={`relative flex h-11 flex-1 items-center justify-center text-sm font-semibold ${
              isActive
                ? 'bg-orange-500 text-white'
                : isVisited
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-500'
            } ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === primary.length - 1 ? 'rounded-r-lg' : ''}`}
            style={{
              clipPath: idx < primary.length - 1
                ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)'
                : idx > 0
                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
                : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)',
            }}
          >
            {stage.name}
          </div>
        );
      })}
    </div>
  );
}

// ── Navigation Steps (numbered circles) ──

function NavigationStepsBar({ steps }: { steps: NavigationStep[] }) {
  if (steps.length <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-0 py-4">
      {steps.map((step, idx) => {
        const isCurrent = step.visited_status === 'current';
        const isVisited = step.visited_status === 'visited';
        const stepNum = String(idx + 1).padStart(2, '0');
        return (
          <div key={step.ID} className="flex items-center">
            {idx > 0 && <div className={`h-px w-16 ${isVisited || isCurrent ? 'bg-orange-300' : 'bg-gray-200'}`} />}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${
                isCurrent
                  ? 'border-orange-500 bg-white text-orange-500'
                  : isVisited
                  ? 'border-green-500 bg-green-50 text-green-600'
                  : 'border-gray-200 bg-white text-gray-400'
              }`}>
                {stepNum}
              </div>
              <span className={`text-xs whitespace-nowrap ${
                isCurrent ? 'font-semibold text-orange-500' : isVisited ? 'text-green-600' : 'text-gray-400'
              }`}>
                {step.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Collapsible Section ──

function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {open ? (
          <ChevronDownIcon className="h-5 w-5 text-orange-500" />
        ) : (
          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {open && <div className="pb-6">{children}</div>}
    </div>
  );
}

// ── Helpers ──

function extractFormState(response: Record<string, unknown>): { fields: FormField[]; values: Record<string, string> } {
  let extracted = extractFieldsFromUiResources(response);
  if (extracted.length === 0) {
    extracted = extractFields(response);
  }
  const values: Record<string, string> = {};
  for (const f of extracted) {
    values[f.reference || f.fieldID] = f.value ?? '';
  }
  return { fields: extracted, values };
}

/** Group fields by their groupName */
function groupFields(fields: FormField[]): Map<string, FormField[]> {
  const groups = new Map<string, FormField[]>();
  for (const f of fields) {
    const name = f.groupName || 'Details';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(f);
  }
  return groups;
}

// ── Main component ──

export function AssignmentDetail() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as Record<string, unknown> | null;

  const [pageData, setPageData] = useState<AssignmentPageData | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyFields = useCallback(async (f: FormField[], v: Record<string, string>) => {
    setFields([...f]);
    setFormValues(v);
    const hasRefer = f.some((field) => field.datasource?.name && field.options.length === 0);
    if (hasRefer) {
      await resolveDataSources(f);
      setFields([...f]);
    }
  }, []);

  const loadFromResponse = useCallback((response: Record<string, unknown>, id: string) => {
    const pd = extractPageData(response, id);
    setPageData(pd);
    const { fields: f, values: v } = extractFormState(response);
    setFields(f);
    setFormValues(v);
    applyFields(f, v);
    return { pageData: pd, fieldsCount: f.length };
  }, [applyFields]);

  const loadAssignment = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);

    const id = decodeURIComponent(assignmentId);

    let pd: AssignmentPageData;
    let fieldsCount = 0;

    if (navState) {
      const result = loadFromResponse(navState as Record<string, unknown>, id);
      pd = result.pageData;
      fieldsCount = result.fieldsCount;
    } else {
      pd = extractPageData(null, id);
    }

    try {
      const asgn = await getAssignment(id);
      const asgnObj = asgn as unknown as Record<string, unknown>;
      if (str(asgnObj.name)) pd.assignmentName = str(asgnObj.name);
      if (str(asgnObj.caseID)) pd.caseId = str(asgnObj.caseID);
      if (str(asgnObj.instructions)) pd.instructions = str(asgnObj.instructions);
      const asgnActions = asgnObj.actions as Array<Record<string, unknown>> | undefined;
      if (asgnActions && asgnActions.length > 0 && pd.actions.length === 0) {
        pd.actions = asgnActions.map((a) => {
          const links = a.links as Record<string, Record<string, unknown>> | undefined;
          return {
            ID: str(a.ID),
            name: str(a.name),
            submitHref: str(links?.submit?.href),
            saveHref: str(links?.save?.href),
            openHref: str(links?.open?.href),
          };
        });
      }
    } catch {
      // Assignment API failed
    }

    setPageData({ ...pd });

    if (fieldsCount === 0) {
      const firstAction = pd.actions[0];
      try {
        let actionView: Record<string, unknown>;
        if (firstAction?.openHref) {
          actionView = await openAssignmentActionByHref(firstAction.openHref);
        } else {
          actionView = await getAssignmentActionView(id, firstAction?.ID || 'pyDefault');
        }
        const { fields: f, values: v } = extractFormState(actionView);
        await applyFields(f, v);

        if (pd.navigationSteps.length === 0) {
          const refreshed = extractPageData(actionView, id);
          if (refreshed.navigationSteps.length > 0) pd.navigationSteps = refreshed.navigationSteps;
          if (refreshed.mainButtons.length > 0) pd.mainButtons = refreshed.mainButtons;
          if (refreshed.secondaryButtons.length > 0) pd.secondaryButtons = refreshed.secondaryButtons;
          setPageData({ ...pd });
        }
      } catch {
        // Action view not available
      }
    }

    setLoading(false);
  }, [assignmentId, navState, loadFromResponse]);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  function handleFieldChange(fieldKey: string, value: string) {
    setFormValues((prev) => ({ ...prev, [fieldKey]: value }));
  }

  function buildContent(): Record<string, unknown> {
    const content: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.readOnly || field.disabled) continue;
      const key = field.reference || field.fieldID;
      const parts = key.replace(/^\./, '').split('.');
      let current = content;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]] || typeof current[parts[i]] !== 'object') current[parts[i]] = {};
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = formValues[key] ?? '';
    }
    return content;
  }

  async function loadNextStep(response: Record<string, unknown>, nextId: string) {
    const result = loadFromResponse(response, nextId);
    if (result.fieldsCount > 0) return;

    const nextAction = result.pageData.actions[0];
    const aId = nextAction?.ID || 'pyDefault';

    try {
      let actionView: Record<string, unknown>;
      if (nextAction?.openHref) {
        actionView = await openAssignmentActionByHref(nextAction.openHref);
      } else {
        actionView = await getAssignmentActionView(nextId, aId);
      }

      const { fields: f, values: v } = extractFormState(actionView);
      if (f.length > 0) {
        await applyFields(f, v);
      }

      const refreshed = extractPageData(actionView, nextId);
      setPageData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...(refreshed.navigationSteps.length > 0 && { navigationSteps: refreshed.navigationSteps }),
          ...(refreshed.mainButtons.length > 0 && { mainButtons: refreshed.mainButtons }),
          ...(refreshed.secondaryButtons.length > 0 && { secondaryButtons: refreshed.secondaryButtons }),
          ...(refreshed.actions.length > 0 && { actions: refreshed.actions }),
        };
      });
    } catch {
      // Action view not available
    }
  }

  async function handleSubmit() {
    if (!assignmentId || !pageData) return;
    setSubmitting(true);
    setError(null);

    const id = decodeURIComponent(assignmentId);
    const currentAction = pageData.actions[0];

    try {
      const content = buildContent();
      let response: Record<string, unknown>;

      if (currentAction?.submitHref) {
        response = await submitAssignment(currentAction.submitHref, content);
      } else {
        response = await performAssignment(id, currentAction?.ID || 'pyDefault', content);
      }

      const respData = response.data as Record<string, unknown> | undefined;
      const respCaseInfo = respData?.caseInfo as Record<string, unknown> | undefined;
      const respAssignments = respCaseInfo?.assignments as Array<Record<string, unknown>> | undefined;
      const nextAsgn = respAssignments?.[0];
      const nextId = nextAsgn?.ID as string | undefined;

      if (nextId && typeof nextId === 'string') {
        if (nextId === id) {
          await loadNextStep(response, nextId);
        } else {
          await loadNextStep(response, nextId);
          window.history.replaceState(response, '', `/worklist/${encodeURIComponent(nextId)}`);
        }
      } else {
        const caseId = pageData.caseId || (respCaseInfo?.ID as string);
        if (caseId) {
          navigate(`/cases/${encodeURIComponent(caseId)}`);
        } else {
          navigate('/cases');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner message="Loading assignment..." />;
  if (!pageData) return <ErrorAlert message="Assignment not found" />;

  const mainBtnLabel = pageData.mainButtons[0]?.name || pageData.actions[0]?.name || 'Submit';
  const fieldGroups = groupFields(fields);

  return (
    <div className="space-y-4">
      {/* Case Header Bar */}
      <CaseHeaderBar pageData={pageData} />

      {/* Stage Chevron Bar */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <StageChevronBar stages={pageData.stages} currentStageLabel={pageData.stageLabel} />
        </div>
        <div className="shrink-0 pt-2 text-sm">
          <span className="text-gray-500">Need Help? </span>
          <button className="font-medium text-blue-600 hover:underline">Ask your questions!</button>
        </div>
      </div>

      {/* Navigation Steps */}
      <NavigationStepsBar steps={pageData.navigationSteps} />

      {pageData.instructions && (
        <div className="rounded-md bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-800">{pageData.instructions}</p>
        </div>
      )}

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Form Content */}
      <div className="rounded-lg border border-gray-200 bg-white px-8 py-2">
        {fields.length === 0 ? (
          <div className="py-6">
            <p className="text-sm text-gray-500">No form fields available for this step.</p>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageData.owner && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Owner</dt>
                  <dd className="mt-1 text-sm text-gray-900">{pageData.owner}</dd>
                </div>
              )}
              {pageData.urgency && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Urgency</dt>
                  <dd className="mt-1 text-sm text-gray-900">{pageData.urgency}</dd>
                </div>
              )}
              {pageData.createdBy && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Created By</dt>
                  <dd className="mt-1 text-sm text-gray-900">{pageData.createdBy}</dd>
                </div>
              )}
              {pageData.createTime && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{new Date(pageData.createTime).toLocaleString()}</dd>
                </div>
              )}
              {pageData.caseId && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Case ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{pageData.caseId}</dd>
                </div>
              )}
            </dl>
          </div>
        ) : (
          <div>
            {Array.from(fieldGroups.entries()).map(([groupName, groupFields]) => (
              <CollapsibleSection key={groupName} title={groupName}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupFields.map((field) => {
                    const key = field.reference || field.fieldID;
                    return (
                      <div key={key} className={field.controlType.toLowerCase().includes('textarea') ? 'sm:col-span-2 lg:col-span-3' : ''}>
                        <label className="block text-xs font-medium text-gray-500">
                          {field.label}
                          {field.required && <span className="ml-0.5 text-red-500">*</span>}
                        </label>
                        <FieldInput field={field} value={formValues[key] ?? ''} onChange={(val) => handleFieldChange(key, val)} />
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-gray-100 py-5">
          <button
            type="button"
            onClick={() => navigate('/cases')}
            className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Save for Later
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-orange-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : mainBtnLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
