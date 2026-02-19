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

// ── Types ──

interface FieldDataSource {
  name: string;       // data page name, e.g. "D_PowerSubstation"
  keyField: string;   // key property, e.g. "pyGUID"
  textField: string;  // display property, e.g. "SubstationName"
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
}

interface StageInfo {
  ID: string;
  name: string;
  visited_status: string; // "active" | "future" | "visited"
  type: string; // "Primary" | "Alternate"
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
  visited_status: string; // "current" | "future" | "visited"
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

// ── Helpers to extract data from the create-case response (data.caseInfo) ──

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

  // Navigate into data.caseInfo
  const data = navState.data as Record<string, unknown> | undefined;
  const ci = (data?.caseInfo ?? navState) as Record<string, unknown>;

  // Assignments
  const assignments = ci.assignments as Array<Record<string, unknown>> | undefined;
  const firstAsgn = assignments?.[0];
  const asgnActions = firstAsgn?.actions as Array<Record<string, unknown>> | undefined;

  // Stages
  const rawStages = ci.stages as Array<Record<string, unknown>> | undefined;
  const stages: StageInfo[] = (rawStages ?? []).map((s) => ({
    ID: str(s.ID),
    name: str(s.name),
    visited_status: str(s.visited_status),
    type: str(s.type),
  }));

  // Actions from the first assignment's actions – include links
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

  // Navigation steps & action buttons from uiResources
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

// ── Field extraction from assignment action view response ──

// Legacy v1 field extraction (fallback)
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

  // Get content for current values and view-name resolution
  const data = response.data as Record<string, unknown> | undefined;
  const caseInfo = data?.caseInfo as Record<string, unknown> | undefined;
  const content = caseInfo?.content as Record<string, unknown> | undefined;

  const fields: FormField[] = [];
  const visited = new Set<string>(); // prevent infinite view recursion

  function traverseNode(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    const type = n.type as string | undefined;
    const config = n.config as Record<string, unknown> | undefined;

    // Handle view references like { type: "reference", config: { type: "view", name: "@P .pyViewName" } }
    if (type === 'reference' && config?.type === 'view') {
      let viewName = config.name as string | undefined;
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

    // Handle field components (TextInput, Dropdown, etc.)
    if (type && FIELD_COMPONENT_TYPES.has(type) && config) {
      const valueRef = config.value as string | undefined;
      if (valueRef) {
        const fieldName = resolvePropertyRef(valueRef);
        if (fieldName) {
          const metaArr = fieldsMeta?.[fieldName] as unknown[] | undefined;
          const meta = metaArr?.[0] as Record<string, unknown> | undefined;

          // Resolve label: @FL, @L, @LR etc. → look up in field metadata
          let label = fieldName;
          const labelRef = config.label as string | undefined;
          if (labelRef) {
            if (labelRef.startsWith('@')) {
              // Any Pega reference → resolve from field metadata
              label = (meta?.label as string) || fieldName;
            } else {
              label = labelRef;
            }
          }

          // Resolve inline options for dropdowns
          let options: { key: string; value: string }[] = [];
          const listSource = config.datasource as Record<string, unknown> | undefined;
          if (listSource?.records && Array.isArray(listSource.records)) {
            options = (listSource.records as Array<Record<string, string>>).map((r) => ({
              key: r.key ?? r.value ?? '',
              value: r.value ?? r.key ?? '',
            }));
          }

          // Detect data source for refer-type fields
          let datasource: FieldDataSource | undefined;

          // 1. Check component config datasource (e.g. AutoComplete/Dropdown with @DATASOURCE)
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

          // 2. Check field metadata for dataRetrievalType "refer"
          if (!datasource && meta?.dataRetrievalType === 'refer') {
            const metaDs = meta.datasource as Record<string, unknown> | undefined;
            const dsName = metaDs?.name as string | undefined;
            if (dsName) {
              datasource = {
                name: dsName,
                keyField: 'pyGUID',
                textField: '',  // resolved after fetching
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
          });
        }
      }
    }

    // Recurse into children
    const children = n.children as unknown[] | undefined;
    if (children) {
      for (const child of children) traverseNode(child);
    }
  }

  // Start from root reference if available
  const root = uiResources.root as Record<string, unknown> | undefined;
  if (root) {
    traverseNode(root);
  }

  // Fallback: if root didn't yield fields, traverse all non-wrapper views directly
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

/** Pick the first descriptive text property as the display field */
function pickDisplayField(record: Record<string, unknown>): string {
  for (const [key, val] of Object.entries(record)) {
    if (SYSTEM_FIELDS.has(key)) continue;
    if (key.startsWith('px') || key.startsWith('pz')) continue;
    if (typeof val === 'string' && val.length > 0) return key;
  }
  return 'pyGUID';
}

/** Fetch data pages for all refer-type fields and populate their options */
async function resolveDataSources(fields: FormField[]): Promise<FormField[]> {
  const referFields = fields.filter((f) => f.datasource?.name && f.options.length === 0);
  if (referFields.length === 0) return fields;

  // Group by datasource name to avoid duplicate fetches
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
        // Data source fetch failed – field stays as text input
      }
    }),
  );

  return fields;
}

// ── Field rendering ──

function FieldInput({ field, value, onChange }: { field: FormField; value: string; onChange: (val: string) => void }) {
  const base = 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500';

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
    return <input type="checkbox" checked={value === 'true'} onChange={(e) => onChange(e.target.checked ? 'true' : 'false')} className="mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />;
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

// ── Stages sidebar ──

function StagesSidebar({ stages, currentStageLabel }: { stages: StageInfo[]; currentStageLabel: string }) {
  // Show primary stages first, then alternate
  const primary = stages.filter((s) => s.type === 'Primary');
  const alternate = stages.filter((s) => s.type === 'Alternate');

  if (primary.length === 0 && alternate.length === 0) return null;

  function renderStages(list: StageInfo[]) {
    return list.map((stage, idx) => {
      const isActive = stage.visited_status === 'active' || stage.name === currentStageLabel;
      const isVisited = stage.visited_status === 'visited';
      return (
        <li key={stage.ID} className="flex items-center gap-3 py-2">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            isActive ? 'bg-blue-600 text-white' : isVisited ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
          }`}>
            {isActive ? idx + 1 : isVisited ? '\u2713' : idx + 1}
          </span>
          <span className={`text-sm ${isActive ? 'font-semibold text-gray-900' : isVisited ? 'text-gray-600' : 'text-gray-400'}`}>
            {stage.name}
          </span>
        </li>
      );
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Stages</h3>
      <ol className="space-y-1">{renderStages(primary)}</ol>
      {alternate.length > 0 && (
        <>
          <h4 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Alternate</h4>
          <ol className="space-y-1">{renderStages(alternate)}</ol>
        </>
      )}
    </div>
  );
}

// ── Navigation steps (multi-step within an assignment) ──

function NavigationStepsBar({ steps }: { steps: NavigationStep[] }) {
  if (steps.length <= 1) return null;

  return (
    <nav className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
      {steps.map((step, idx) => {
        const isCurrent = step.visited_status === 'current';
        const isVisited = step.visited_status === 'visited';
        return (
          <div key={step.ID} className="flex items-center gap-2">
            {idx > 0 && <span className="text-gray-300">&rarr;</span>}
            <div className="flex items-center gap-1.5">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isCurrent ? 'bg-blue-600 text-white' : isVisited ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
              }`}>
                {isVisited ? '\u2713' : idx + 1}
              </span>
              <span className={`text-sm ${isCurrent ? 'font-semibold text-gray-900' : isVisited ? 'text-gray-600' : 'text-gray-400'}`}>
                {step.name}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

// ── Helpers: apply response to component state ──

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

  /** Apply extracted fields + resolve data sources, then update state */
  const applyFields = useCallback(async (f: FormField[], v: Record<string, string>) => {
    // Set fields immediately so the UI shows something
    setFields([...f]);
    setFormValues(v);
    // Resolve refer-type data sources in the background
    const hasRefer = f.some((field) => field.datasource?.name && field.options.length === 0);
    if (hasRefer) {
      await resolveDataSources(f);
      setFields([...f]); // re-set with populated options
    }
  }, []);

  /** Load assignment data from a response object (navState or submit response) */
  const loadFromResponse = useCallback((response: Record<string, unknown>, id: string) => {
    const pd = extractPageData(response, id);
    setPageData(pd);

    const { fields: f, values: v } = extractFormState(response);
    setFields(f);
    setFormValues(v);

    // Kick off async data source resolution
    applyFields(f, v);

    return { pageData: pd, fieldsCount: f.length };
  }, [applyFields]);

  const loadAssignment = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);

    const id = decodeURIComponent(assignmentId);

    // 1. Build page data from navState (create case / previous submit response)
    let pd: AssignmentPageData;
    let fieldsCount = 0;

    if (navState) {
      const result = loadFromResponse(navState as Record<string, unknown>, id);
      pd = result.pageData;
      fieldsCount = result.fieldsCount;
    } else {
      pd = extractPageData(null, id);
    }

    // 2. Try to enrich from assignment API
    try {
      const asgn = await getAssignment(id);
      const asgnObj = asgn as unknown as Record<string, unknown>;
      if (str(asgnObj.name)) pd.assignmentName = str(asgnObj.name);
      if (str(asgnObj.caseID)) pd.caseId = str(asgnObj.caseID);
      if (str(asgnObj.instructions)) pd.instructions = str(asgnObj.instructions);
      // Enrich actions if not already populated
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
      // Assignment API failed, continue with navState data
    }

    setPageData({ ...pd });

    // 3. If no fields from navState, fetch via the action's open link or action view API
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

        // Also extract navigation/buttons from action view if not already set
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

  /** After submit, try to load the next step's fields from the response or via API */
  async function loadNextStep(response: Record<string, unknown>, nextId: string) {
    // 1. Try extracting everything from the submit response
    const result = loadFromResponse(response, nextId);

    if (result.fieldsCount > 0) return; // fields found, done

    // 2. No fields in submit response → call the next action's open href (GET)
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

      // Update navigation steps / buttons from the action view response
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

      // Use the action's submit href (PATCH) if available, otherwise fallback
      if (currentAction?.submitHref) {
        response = await submitAssignment(currentAction.submitHref, content);
      } else {
        response = await performAssignment(id, currentAction?.ID || 'pyDefault', content);
      }

      // Parse response for next assignment
      const respData = response.data as Record<string, unknown> | undefined;
      const respCaseInfo = respData?.caseInfo as Record<string, unknown> | undefined;
      const respAssignments = respCaseInfo?.assignments as Array<Record<string, unknown>> | undefined;
      const nextAsgn = respAssignments?.[0];
      const nextId = nextAsgn?.ID as string | undefined;

      if (nextId && typeof nextId === 'string') {
        if (nextId === id) {
          // Same assignment, next step (multi-step) → update in place + fetch if needed
          await loadNextStep(response, nextId);
        } else {
          // Different assignment → update in place + fetch if needed
          await loadNextStep(response, nextId);
          // Update URL to reflect the new assignment without a full reload
          window.history.replaceState(response, '', `/worklist/${encodeURIComponent(nextId)}`);
        }
      } else {
        // No next assignment → case resolved or no more steps
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

  // Determine the main button label from uiResources actionButtons
  const mainBtnLabel = pageData.mainButtons[0]?.name || pageData.actions[0]?.name || 'Submit';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/cases')} className="text-sm text-blue-600 hover:underline">
            &larr; Back to Cases
          </button>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{pageData.assignmentName}</h2>
          <p className="text-sm text-gray-500">
            {pageData.caseName && <span>{pageData.caseName} &middot; </span>}
            {pageData.caseId}
          </p>
        </div>
        {pageData.status && (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            {pageData.status}
          </span>
        )}
      </div>

      {/* Navigation steps (multi-step within assignment) */}
      <NavigationStepsBar steps={pageData.navigationSteps} />

      {pageData.instructions && (
        <div className="rounded-md bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-800">{pageData.instructions}</p>
        </div>
      )}

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="flex gap-6">
        {/* Main form area */}
        <div className="flex-1">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {fields.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">No form fields available for this step.</p>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {pageData.owner && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Owner</dt>
                      <dd className="mt-1 text-sm text-gray-900">{pageData.owner}</dd>
                    </div>
                  )}
                  {pageData.urgency && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Urgency</dt>
                      <dd className="mt-1 text-sm text-gray-900">{pageData.urgency}</dd>
                    </div>
                  )}
                  {pageData.createdBy && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created By</dt>
                      <dd className="mt-1 text-sm text-gray-900">{pageData.createdBy}</dd>
                    </div>
                  )}
                  {pageData.createTime && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900">{new Date(pageData.createTime).toLocaleString()}</dd>
                    </div>
                  )}
                  {pageData.caseId && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Case ID</dt>
                      <dd className="mt-1 text-sm text-gray-900">{pageData.caseId}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {fields.map((field) => {
                  const key = field.reference || field.fieldID;
                  return (
                    <div key={key} className={field.controlType.toLowerCase().includes('textarea') ? 'sm:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="ml-1 text-red-500">*</span>}
                      </label>
                      <FieldInput field={field} value={formValues[key] ?? ''} onChange={(val) => handleFieldChange(key, val)} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <button type="button" onClick={() => navigate('/cases')}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60">
                {submitting ? 'Submitting...' : mainBtnLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="hidden w-64 shrink-0 lg:block">
          <StagesSidebar stages={pageData.stages} currentStageLabel={pageData.stageLabel} />

          {/* Details card */}
          <div className={`${pageData.stages.length > 0 ? 'mt-4' : ''} rounded-lg border border-gray-200 bg-white p-4 shadow-sm`}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Details</h3>
            <dl className="space-y-2 text-sm">
              {pageData.owner && (
                <div><dt className="text-gray-500">Owner</dt><dd className="font-medium text-gray-900">{pageData.owner}</dd></div>
              )}
              {pageData.createdBy && (
                <div><dt className="text-gray-500">Created By</dt><dd className="font-medium text-gray-900">{pageData.createdBy}</dd></div>
              )}
              {pageData.urgency && (
                <div><dt className="text-gray-500">Urgency</dt><dd className="font-medium text-gray-900">{pageData.urgency}</dd></div>
              )}
              {pageData.status && (
                <div><dt className="text-gray-500">Status</dt><dd className="font-medium text-gray-900">{pageData.status}</dd></div>
              )}
              {pageData.createTime && (
                <div><dt className="text-gray-500">Created</dt><dd className="font-medium text-gray-900">{new Date(pageData.createTime).toLocaleString()}</dd></div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
