const API_BASE = import.meta.env.VITE_API_URL as string;

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
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
  role: string;
  implementation: string;
  created_at: string;
}

export const listUsers = (implId: string) =>
  request<ApiResponse<User[]>>(
    `/api/admin/implementations/${implId}/users`
  );

export const assignUser = (
  implId: string,
  data: { phone: string; name: string; role?: string }
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
  type: "image" | "audio" | "video" | "text" | "clarification_response";
  content_type: string;
  size_bytes?: number;
  body?: string;
  timestamp: string;
  public_url?: string;
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
  created_at: string;
}

export interface Session {
  id: string;
  implementation: string;
  user_phone: string;
  user_name: string;
  date: string;
  status: string;
  raw_files: RawFile[];
  segments: unknown;
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
