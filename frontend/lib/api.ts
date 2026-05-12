export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type User = {
  id: string;
  email: string;
  role: "client" | "reviewer" | "admin" | string;
  created_at: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type RiskFinding = {
  id: string;
  rule_code: string;
  severity: string;
  snippet: string | null;
  suggestion: string | null;
  created_at: string;
};

export type DocumentListItem = {
  id: string;
  filename: string;
  mime: string;
  size_bytes: number;
  processing_status: string;
  review_status: string;
  classification: string | null;
  classification_confidence: string | null;
  risk_score: number;
  flag_reasons: string[];
  uploaded_at: string;
  processed_at: string | null;
};

export type DocumentDetail = DocumentListItem & {
  summary: string | null;
  extracted_text: string | null;
  ai_confidence: string | null;
  expiry_date: string | null;
  risk_findings: RiskFinding[];
};

export type DocumentUploadResponse = {
  id: string;
  filename: string;
  processing_status: string;
  review_status: string;
  message: string;
};

export type AdminDocumentListItem = {
  id: string;
  filename: string;
  owner_email: string;
  review_status: string;
  processing_status: string;
  classification: string | null;
  risk_score: number;
  flag_reasons: string[];
  uploaded_at: string;
  processed_at: string | null;
};

export type AdminReview = {
  id: string;
  reviewer_email: string | null;
  decision: string;
  comment: string | null;
  override_ai: boolean;
  created_at: string;
};

export type AuditLog = {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type AdminDocumentDetail = AdminDocumentListItem & {
  mime: string;
  size_bytes: number;
  sha256: string;
  summary: string | null;
  extracted_text: string | null;
  classification_confidence: string | null;
  ai_confidence: string | null;
  risk_findings: RiskFinding[];
  reviews: AdminReview[];
  audit_logs: AuditLog[];
};

export type AdminStats = {
  total_documents: number;
  ai_approved: number;
  pending_admin: number;
  admin_approved: number;
  admin_rejected: number;
  failed: number;
  agreement_rate: number;
  top_flag_reason: string | null;
};

export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("legalreview_token");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Yêu cầu thất bại (${response.status})`;
    try {
      const errorBody = (await response.json()) as { detail?: string };
      if (errorBody.detail) {
        message = translateApiMessage(errorBody.detail);
      }
    } catch {
      // Keep the status-based fallback when the backend does not return JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function fetchMe(token: string): Promise<User> {
  const response = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Phiên đăng nhập đã hết hạn");
  }

  return response.json();
}

export function fetchDocuments(): Promise<DocumentListItem[]> {
  return apiFetch<DocumentListItem[]>("/api/v1/documents");
}

export function fetchDocument(id: string): Promise<DocumentDetail> {
  return apiFetch<DocumentDetail>(`/api/v1/documents/${id}`);
}

export async function uploadDocument(file: File): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.set("file", file);
  return apiFetch<DocumentUploadResponse>("/api/v1/documents", {
    method: "POST",
    body: formData,
  });
}

export function fetchAdminQueue(): Promise<AdminDocumentListItem[]> {
  return apiFetch<AdminDocumentListItem[]>("/api/v1/admin/queue");
}

export function fetchAdminDocument(id: string): Promise<AdminDocumentDetail> {
  return apiFetch<AdminDocumentDetail>(`/api/v1/admin/documents/${id}`);
}

export function submitAdminDecision(
  id: string,
  payload: { decision: "approve" | "reject"; comment: string },
): Promise<{ document_id: string; review_status: string; decision: string; message: string }> {
  return apiFetch<{ document_id: string; review_status: string; decision: string; message: string }>(
    `/api/v1/admin/documents/${id}/decision`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function fetchAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/api/v1/admin/stats");
}

export function fetchAuditLogs(): Promise<AuditLog[]> {
  return apiFetch<AuditLog[]>("/api/v1/admin/audit-logs");
}

function translateApiMessage(message: string): string {
  const labels: Record<string, string> = {
    "Access denied": "Bạn không có quyền truy cập",
    "Could not validate credentials": "Không thể xác thực phiên đăng nhập",
    "Document is not pending admin review": "Tài liệu không còn chờ admin duyệt",
    "Document not found": "Không tìm thấy tài liệu",
    "Invalid email or password": "Email hoặc mật khẩu không đúng",
    "Reviewer access required": "Bạn cần quyền người rà soát hoặc admin",
    "Session expired": "Phiên đăng nhập đã hết hạn",
  };

  return labels[message] ?? message;
}
