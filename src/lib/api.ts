import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_URL as string;

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    console.warn("[api] No auth token available — session may not be active");
  } catch (e) {
    console.error("[api] Failed to get auth session:", e);
  }
  return {};
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders, ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

// ── Implementations ──

export interface Implementation {
  id: string;
  name: string;
  industry: string | null;
  country: string;
  language: string;
  primary_color: string;
  vision_system_prompt: string;
  segmentation_prompt_template: string;
  google_spreadsheet_id: string | null;
  trigger_words: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export const listImplementations = () =>
  request<ApiResponse<Implementation[]>>("/api/admin/implementations");

export const getImplementation = (id: string) =>
  request<ApiResponse<Implementation>>(`/api/admin/implementations/${id}`);

export const createImplementation = (data: Partial<Implementation>) =>
  request<ApiResponse<Implementation>>("/api/admin/implementations", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateImplementation = (
  id: string,
  data: Partial<Implementation>
) =>
  request<ApiResponse<Implementation>>(`/api/admin/implementations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteImplementation = (id: string) =>
  request<ApiResponse<{ id: string; status: string }>>(
    `/api/admin/implementations/${id}`,
    { method: "DELETE" }
  );

// ── Visit Types ──

export interface VisitType {
  id: string;
  implementation_id: string;
  slug: string;
  display_name: string;
  schema_json: Record<string, unknown>;
  sheets_tab: string | null;
  confidence_threshold: number;
  sort_order: number;
  is_active: boolean;
}

export const listVisitTypes = (implId: string) =>
  request<ApiResponse<VisitType[]>>(
    `/api/admin/implementations/${implId}/visit-types`
  );

export const createVisitType = (
  implId: string,
  data: Partial<VisitType>
) =>
  request<ApiResponse<VisitType>>(
    `/api/admin/implementations/${implId}/visit-types`,
    { method: "POST", body: JSON.stringify(data) }
  );

export const updateVisitType = (vtId: string, data: Partial<VisitType>) =>
  request<ApiResponse<VisitType>>(`/api/admin/visit-types/${vtId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteVisitType = (vtId: string) =>
  request<ApiResponse<{ id: string; is_active: boolean }>>(
    `/api/admin/visit-types/${vtId}`,
    { method: "DELETE" }
  );

// ── Users ──

export interface User {
  id: string;
  phone: string;
  name: string;
  implementation: string;
  implementation_id: string;
  role: string;
  country: string;
  group_id: string | null;
  tags: string[];
  created_at: string;
}

export const listUsers = (implId: string) =>
  request<ApiResponse<User[]>>(
    `/api/admin/implementations/${implId}/users`
  );

export const assignUser = (
  implId: string,
  data: { phone: string; name: string; role?: string; country?: string }
) =>
  request<ApiResponse<User>>(
    `/api/admin/implementations/${implId}/users`,
    { method: "POST", body: JSON.stringify(data) }
  );

export const removeUser = (implId: string, phone: string) =>
  request<ApiResponse<{ phone: string; removed: boolean }>>(
    `/api/admin/implementations/${implId}/users/${encodeURIComponent(phone)}`,
    { method: "DELETE" }
  );

// ── Bulk Import ──

export interface BulkImportResult {
  created: number;
  updated: number;
  errors: string[];
  total_processed: number;
}

export const bulkImportUsers = (
  implId: string,
  users: Array<{ phone: string; name: string; role?: string; country?: string; group_slug?: string }>
) =>
  request<ApiResponse<BulkImportResult>>("/api/admin/bulk-import-users", {
    method: "POST",
    body: JSON.stringify({ implementation_id: implId, users }),
  });

// ── Stats ──

export interface Stats {
  period_days: number;
  implementation_filter: string | null;
  sessions: {
    total: number;
    by_status: Record<string, number>;
    by_implementation: Record<string, number>;
  };
  reports: {
    total: number;
    by_status: Record<string, number>;
    avg_confidence: number;
  };
}

export const getStats = (impl?: string, days = 7) => {
  const params = new URLSearchParams();
  if (impl) params.set("impl", impl);
  params.set("days", String(days));
  return request<ApiResponse<Stats>>(`/api/admin/stats?${params}`);
};

// ── Sessions ──

export interface RawFile {
  filename: string | null;
  storage_path: string | null;
  type: "image" | "audio" | "video" | "text" | "clarification_response" | "location";
  content_type: string;
  size_bytes?: number;
  body?: string;
  timestamp: string;
  public_url?: string;
  transcription?: string;
  image_description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  label?: string;
}

export interface VisitReport {
  id: string;
  session_id: string;
  implementation: string;
  visit_type: string;
  inferred_location: string | null;
  extracted_data: Record<string, unknown>;
  confidence_score: number | null;
  status: string;
  processing_time_ms: number | null;
  strategic_analysis: string | null;
  sheets_row_id: string | null;
  gamma_url: string | null;
  created_at: string;
}

export interface SegmentVisit {
  id: string;
  inferred_location: string;
  visit_type: string;
  confidence: number;
  files: string[];
  time_range: string;
  reasoning?: string;
}

export interface SegmentationData {
  sessions: SegmentVisit[];
  unassigned_files: string[];
  needs_clarification: boolean;
  clarification_message: string;
}

export interface Session {
  id: string;
  implementation: string;
  user_phone: string;
  user_name: string;
  date: string;
  status: string;
  country?: string;
  user_role?: string;
  raw_files: RawFile[];
  segments: SegmentationData | null;
  created_at: string;
  updated_at: string;
  visit_reports?: VisitReport[];
}

export const listSessions = (params?: {
  impl?: string;
  phone?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}) => {
  const sp = new URLSearchParams();
  if (params?.impl) sp.set("impl", params.impl);
  if (params?.phone) sp.set("phone", params.phone);
  if (params?.status) sp.set("status", params.status);
  if (params?.date_from) sp.set("date_from", params.date_from);
  if (params?.date_to) sp.set("date_to", params.date_to);
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.offset) sp.set("offset", String(params.offset));
  return request<ApiResponse<Session[]>>(`/api/admin/sessions?${sp}`);
};

export const getSession = (id: string) =>
  request<ApiResponse<Session>>(`/api/admin/sessions/${id}`);

// ── Config ──

export const reloadConfig = (implId?: string) => {
  const params = implId ? `?impl_id=${implId}` : "";
  return request<ApiResponse<{ reloaded: string }>>(
    `/api/admin/reload-config${params}`,
    { method: "POST" }
  );
};

// ── Test Endpoints ──

export const testVisionPrompt = (imageUrl: string, visionPrompt: string) =>
  request<ApiResponse<{ description: string }>>(
    "/api/admin/test-vision-prompt",
    {
      method: "POST",
      body: JSON.stringify({
        image_url: imageUrl,
        vision_prompt: visionPrompt,
      }),
    }
  );

// ── Report Generation ──

export interface ReportResult {
  report_id: string | null;
  chars: number;
  markdown: string | null;
}

export interface GenerateReportResponse {
  session_id: string;
  report_type?: string;
  report_id?: string | null;
  chars?: number;
  markdown?: string | null;
  reports?: Record<string, ReportResult>;
}

export const generateReport = (sessionId: string, reportType: string) =>
  request<ApiResponse<GenerateReportResponse>>("/api/admin/generate-report", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, report_type: reportType }),
  });

// ── User Groups ──

export interface UserGroup {
  id: string;
  implementation_id: string;
  name: string;
  slug: string;
  zone: string | null;
  tags: string[];
  created_at: string;
}

export const listUserGroups = (impl?: string) => {
  const params = impl ? `?impl=${impl}` : "";
  return request<ApiResponse<UserGroup[]>>(`/api/admin/user-groups${params}`);
};

export const createUserGroup = (implId: string, data: { name: string; slug: string; zone?: string; tags?: string[] }) =>
  request<ApiResponse<UserGroup>>(`/api/admin/implementations/${implId}/user-groups`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const addGroupMember = (groupId: string, phone: string) =>
  request<ApiResponse<User>>(`/api/admin/user-groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ phone }),
  });

export const removeGroupMember = (groupId: string, phone: string) =>
  request<ApiResponse<{ removed: boolean }>>(`/api/admin/user-groups/${groupId}/members/${encodeURIComponent(phone)}`, {
    method: "DELETE",
  });

// ── Multi-Level Reports ──

export interface MultiLevelReportResponse {
  markdown: string | null;
  chars: number;
  report_id?: string | null;
  sessions_analyzed?: number;
  groups_analyzed?: number;
  total_sessions?: number;
  group_name?: string;
  framework?: string;
}

export const generateGroupReport = (groupId: string, framework: string, dateFrom?: string, dateTo?: string) =>
  request<ApiResponse<MultiLevelReportResponse>>("/api/admin/generate-group-report", {
    method: "POST",
    body: JSON.stringify({ group_id: groupId, framework, date_from: dateFrom, date_to: dateTo }),
  });

export const generateProjectReport = (implId: string, framework: string, dateFrom?: string, dateTo?: string) =>
  request<ApiResponse<MultiLevelReportResponse>>("/api/admin/generate-project-report", {
    method: "POST",
    body: JSON.stringify({ implementation_id: implId, framework, date_from: dateFrom, date_to: dateTo }),
  });

// ── Test Endpoints ──

export const testExtraction = (
  text: string,
  schemaJson: Record<string, unknown>
) =>
  request<ApiResponse<{ raw: string; parsed: unknown }>>(
    "/api/admin/test-extraction",
    {
      method: "POST",
      body: JSON.stringify({ text, schema_json: schemaJson }),
    }
  );
