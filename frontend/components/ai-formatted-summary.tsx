"use client";

import { Fragment, useMemo, type ReactNode } from "react";

import { humanAiSummary } from "@/lib/format";

type Section = { heading: string | null; paragraphs: string[] };
type ReviewItem = { title: string; body: string };

function splitIntoSections(raw: string): Section[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const sections: Section[] = [];
  let current: Section = { heading: null, paragraphs: [] };
  let paraBuffer: string[] = [];

  const flushBuffer = () => {
    const text = paraBuffer.join("\n").trim();
    if (text) {
      current.paragraphs.push(text);
    }
    paraBuffer = [];
  };

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+)\s*$/);
    if (heading) {
      flushBuffer();
      if (current.heading !== null || current.paragraphs.length) {
        sections.push(current);
      }
      current = { heading: heading[1].trim(), paragraphs: [] };
      continue;
    }
    if (line.trim() === "---") {
      flushBuffer();
      continue;
    }
    if (line.trim() === "") {
      flushBuffer();
    } else {
      paraBuffer.push(line);
    }
  }

  flushBuffer();
  if (current.heading !== null || current.paragraphs.length) {
    sections.push(current);
  }

  return sections.length ? sections : [{ heading: null, paragraphs: [raw.trim()] }];
}

function normalizeHeading(heading: string | null): string {
  return (heading ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function sectionKind(section: Section): "risk" | "action" | "missing" | "conclusion" | "support" {
  const heading = normalizeHeading(section.heading);
  if (heading.includes("rui ro") || heading.includes("tranh chap") || heading.includes("thieu sot")) {
    return "risk";
  }
  if (heading.includes("khuyen nghi") || heading.includes("hanh dong") || heading.includes("xu ly")) {
    return "action";
  }
  if (heading.includes("thieu du kien") || heading.includes("tai lieu can") || heading.includes("bo sung")) {
    return "missing";
  }
  if (heading.includes("ket luan") || heading.includes("quyet dinh") || heading.includes("ket qua nhanh")) {
    return "conclusion";
  }
  return "support";
}

function stripListMarker(value: string): string {
  return value.replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/, "").trim();
}

function splitListLikeParagraphs(paragraphs: string[]): string[] {
  const items: string[] = [];

  for (const paragraph of paragraphs) {
    const lines = paragraph.split("\n");
    let current: string[] = [];
    const flush = () => {
      const text = current.join(" ").trim();
      if (text) {
        items.push(stripListMarker(text));
      }
      current = [];
    };

    for (const line of lines) {
      if (/^\s*(?:[-*•]\s+|\d+[.)]\s+)/.test(line)) {
        flush();
        current.push(line);
      } else if (current.length) {
        current.push(line.trim());
      } else if (line.trim()) {
        current.push(line.trim());
      }
    }
    flush();
  }

  return items.filter(Boolean);
}

function sectionItems(sections: Section[], kind: ReturnType<typeof sectionKind>): string[] {
  return sections.filter((section) => sectionKind(section) === kind).flatMap((section) => splitListLikeParagraphs(section.paragraphs));
}

function splitTitleAndBody(raw: string): ReviewItem {
  const text = stripListMarker(raw).replace(/\s+/g, " ").trim();
  const bold = text.match(/^\*\*([^*]+)\*\*\s*[:—-]?\s*(.*)$/);
  if (bold) {
    return { title: bold[1].trim(), body: bold[2].trim() };
  }

  const colonIndex = text.indexOf(":");
  if (colonIndex > 12 && colonIndex <= 90) {
    return {
      title: text.slice(0, colonIndex).trim(),
      body: text.slice(colonIndex + 1).trim(),
    };
  }

  const sentence = text.match(/^(.{32,120}?[.!?])\s+(.+)$/);
  if (sentence) {
    return { title: sentence[1].replace(/[.!?]$/, "").trim(), body: sentence[2].trim() };
  }

  if (text.length > 110) {
    return { title: `${text.slice(0, 96).trim()}...`, body: text };
  }
  return { title: text, body: "" };
}

function renderCitations(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let index = 0;
  for (const match of text.matchAll(/\u201c[^\u201d]*\u201d/g)) {
    if (match.index === undefined) {
      continue;
    }
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-tx-${index}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>,
      );
    }
    nodes.push(
      <mark className="ai-summary-citation" key={`${keyPrefix}-ex-${index}`}>
        {match[0]}
      </mark>,
    );
    lastIndex = match.index + match[0].length;
    index += 1;
  }
  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-tx-tail`}>
        {text.slice(lastIndex)}
      </Fragment>,
    );
  }
  return nodes.length ? nodes : [text];
}

function renderInline(text: string, paraKey: string): ReactNode {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((segment, index) => {
    const bold = segment.match(/^\*\*(.+)\*\*$/);
    if (bold) {
      return (
        <strong className="ai-summary-risk-lead" key={`${paraKey}-bd-${index}`}>
          {renderCitations(bold[1], `${paraKey}-bd-${index}`)}
        </strong>
      );
    }
    return (
      <Fragment key={`${paraKey}-seg-${index}`}>
        {renderCitations(segment, `${paraKey}-seg-${index}`)}
      </Fragment>
    );
  });
}

function ReviewCards({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="ai-formatted-empty">AI chưa tách được rủi ro cụ thể từ phản hồi này.</p>;
  }

  return (
    <div className="ai-risk-card-grid">
      {items.slice(0, 8).map((item, index) => {
        const parsed = splitTitleAndBody(item);
        return (
          <article className="ai-risk-card" key={`${parsed.title}-${index}`}>
            <div className="ai-risk-card-index">{index + 1}</div>
            <div>
              <h4>{renderInline(parsed.title, `risk-title-${index}`)}</h4>
              {parsed.body ? <p>{renderInline(parsed.body, `risk-body-${index}`)}</p> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ActionList({ items }: { items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <ol className="ai-action-list">
      {items.slice(0, 7).map((item, index) => (
        <li key={`${item.slice(0, 30)}-${index}`}>{renderInline(stripListMarker(item), `action-${index}`)}</li>
      ))}
    </ol>
  );
}

function SupportingSections({ sections }: { sections: Section[] }) {
  if (!sections.length) {
    return null;
  }

  return (
    <details className="ai-supporting-details">
      <summary>Bối cảnh, nội dung và căn cứ tham khảo</summary>
      <div className="ai-supporting-grid">
        {sections.map((section, si) => (
          <section className="ai-summary-block" key={`${section.heading ?? "intro"}-${si}`}>
            {section.heading ? <h3 className="ai-summary-block-title">{section.heading}</h3> : null}
            {section.paragraphs.map((paragraph, pi) => (
              <p className="ai-summary-paragraph" key={pi}>
                {renderInline(paragraph, `support-${si}-${pi}`)}
              </p>
            ))}
          </section>
        ))}
      </div>
    </details>
  );
}

export function AiFormattedSummary({ text }: { text: string | null }) {
  const review = useMemo(() => {
    const normalized = (humanAiSummary(text) ?? "").trim();
    if (!normalized) {
      return null;
    }
    const sections = splitIntoSections(normalized);
    const riskItems = sectionItems(sections, "risk");
    const actionItems = sectionItems(sections, "action");
    const missingItems = sectionItems(sections, "missing");
    const conclusionItems = sectionItems(sections, "conclusion");
    const supportSections = sections.filter((section) => sectionKind(section) === "support");

    return {
      actionItems,
      conclusionItems,
      missingItems,
      riskItems: riskItems.length ? riskItems : sections.flatMap((section) => splitListLikeParagraphs(section.paragraphs)).slice(0, 4),
      supportSections,
    };
  }, [text]);

  if (!review) {
    return <p className="ai-formatted-empty">Chưa có phân tích AI cho tài liệu này.</p>;
  }

  return (
    <div className="ai-review-focus">
      {review.conclusionItems.length ? (
        <section className="ai-review-snapshot">
          <span className="ai-review-section-kicker">Kết luận nhanh</span>
          <ul>
            {review.conclusionItems.slice(0, 3).map((item, index) => (
              <li key={`${item.slice(0, 24)}-${index}`}>{renderInline(stripListMarker(item), `snapshot-${index}`)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="ai-review-risk-section">
        <div className="ai-review-section-heading">
          <span className="ai-review-section-kicker">Trọng tâm review</span>
          <h3>Rủi ro cần xử lý trước</h3>
        </div>
        <ReviewCards items={review.riskItems} />
      </section>

      {review.missingItems.length ? (
        <section className="ai-review-missing-section">
          <span className="ai-review-section-kicker">Thiếu dữ kiện</span>
          <ActionList items={review.missingItems} />
        </section>
      ) : null}

      {review.actionItems.length ? (
        <section className="ai-review-action-section">
          <span className="ai-review-section-kicker">Việc cần làm tiếp</span>
          <ActionList items={review.actionItems} />
        </section>
      ) : null}

      <SupportingSections sections={review.supportSections} />
    </div>
  );
}
