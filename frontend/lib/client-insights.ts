import { DocumentDetail, DocumentListItem, LegalObligation, fetchDocument, fetchDocuments } from "@/lib/api";

export type ClientPortfolio = {
  documents: DocumentListItem[];
  details: DocumentDetail[];
};

export type EnrichedObligation = LegalObligation & {
  document_id: string;
  document_filename: string;
};

export type ClientNotification = {
  id: string;
  title: string;
  copy: string;
  tone: "success" | "warning" | "danger" | "neutral";
  created_at: string;
  href: string;
};

export async function loadClientPortfolio(): Promise<ClientPortfolio> {
  const documents = await fetchDocuments("all");
  const detailResults = await Promise.allSettled(documents.slice(0, 60).map((document) => fetchDocument(document.id)));
  const details = detailResults
    .filter((result): result is PromiseFulfilledResult<DocumentDetail> => result.status === "fulfilled")
    .map((result) => result.value);
  return { documents, details };
}

export function documentsNeedingAction(documents: DocumentListItem[], details: DocumentDetail[] = []): DocumentListItem[] {
  const obligationDocumentIds = new Set(
    collectObligations(details)
      .filter((obligation) => ["overdue", "due_soon"].includes(obligation.urgency) || ["high", "critical"].includes(obligation.severity))
      .map((obligation) => obligation.document_id),
  );
  return documents.filter((document) => {
    return (
      ["failed", "needs_reviewer", "pending_admin", "reviewer_rejected"].includes(document.review_status) ||
      document.risk_score >= 70 ||
      obligationDocumentIds.has(document.id)
    );
  });
}

export function collectObligations(details: DocumentDetail[]): EnrichedObligation[] {
  return details.flatMap((document) =>
    document.legal_obligations.map((obligation) => ({
      ...obligation,
      document_id: document.id,
      document_filename: document.filename,
    })),
  ).sort((left, right) => {
    const leftDate = left.due_date ? new Date(left.due_date).getTime() : Number.POSITIVE_INFINITY;
    const rightDate = right.due_date ? new Date(right.due_date).getTime() : Number.POSITIVE_INFINITY;
    return leftDate - rightDate;
  });
}

export function topFlags(documents: DocumentListItem[], limit = 5): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const document of documents) {
    for (const flag of document.flag_reasons) {
      counts.set(flag, (counts.get(flag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
}

export function riskDistribution(documents: DocumentListItem[]) {
  return {
    high: documents.filter((document) => document.risk_score >= 70).length,
    medium: documents.filter((document) => document.risk_score >= 40 && document.risk_score < 70).length,
    low: documents.filter((document) => document.risk_score < 40).length,
  };
}

export function buildClientNotifications(portfolio: ClientPortfolio): ClientNotification[] {
  const obligationNotifications = collectObligations(portfolio.details)
    .filter((obligation) => ["overdue", "due_soon"].includes(obligation.urgency) || ["high", "critical"].includes(obligation.severity))
    .slice(0, 8)
    .map((obligation) => ({
      id: `obligation-${obligation.id}`,
      title: obligation.urgency === "overdue" ? "Mốc pháp lý quá hạn" : "Mốc pháp lý cần theo dõi",
      copy: `${obligation.title} trong ${obligation.document_filename}`,
      tone: obligation.urgency === "overdue" ? "danger" as const : "warning" as const,
      created_at: obligation.created_at,
      href: `/documents/${obligation.document_id}`,
    }));

  const documentNotifications = portfolio.documents.slice(0, 12).map((document) => ({
    id: `document-${document.id}`,
    title: documentNotificationTitle(document),
    copy: `${document.filename} · điểm rủi ro ${document.risk_score}`,
    tone: documentTone(document),
    created_at: document.processed_at ?? document.uploaded_at,
    href: `/documents/${document.id}`,
  }));

  return [...obligationNotifications, ...documentNotifications]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 20);
}

export function daysUntil(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(value);
  dueDate.setHours(0, 0, 0, 0);
  return Math.round((dueDate.getTime() - today.getTime()) / 86_400_000);
}

export function averageRisk(documents: DocumentListItem[]): number {
  if (!documents.length) {
    return 0;
  }
  return Math.round(documents.reduce((sum, document) => sum + document.risk_score, 0) / documents.length);
}

export function documentTone(document: DocumentListItem): "success" | "warning" | "danger" | "neutral" {
  if (document.review_status === "failed" || document.review_status === "reviewer_rejected" || document.risk_score >= 70) {
    return "danger";
  }
  if (["needs_reviewer", "pending_admin", "processing", "pending"].includes(document.review_status) || document.risk_score >= 40) {
    return "warning";
  }
  if (["ai_approved", "reviewer_approved"].includes(document.review_status)) {
    return "success";
  }
  return "neutral";
}

function documentNotificationTitle(document: DocumentListItem): string {
  if (document.review_status === "failed") {
    return "Tài liệu xử lý lỗi";
  }
  if (document.review_status === "reviewer_rejected") {
    return "Người rà soát đã từ chối";
  }
  if (document.review_status === "needs_reviewer" || document.review_status === "pending_admin") {
    return "Tài liệu cần người rà soát";
  }
  if (document.review_status === "reviewer_approved") {
    return "Người rà soát đã duyệt";
  }
  if (document.review_status === "ai_approved") {
    return "AI đã duyệt tài liệu";
  }
  return "Tài liệu được cập nhật";
}
