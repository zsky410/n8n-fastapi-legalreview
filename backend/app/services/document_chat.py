from __future__ import annotations

import json
import logging
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.models.document import Document
from app.models.document_chat import DocumentChatMessage
from app.models.risk_finding import RiskFinding
from app.models.user_profile import UserProfile
from app.services.ai_review import _build_review_excerpt

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class DocumentChatResult:
    content: str
    provider: str
    model: str | None


def answer_document_chat(
    *,
    document: Document,
    question: str,
    history: list[DocumentChatMessage],
    risk_findings: list[RiskFinding],
    user_profile: UserProfile | None = None,
) -> DocumentChatResult:
    """Answer a follow-up question using only the reviewed document context."""

    model = settings.openai_chat_model or settings.openai_review_model
    if not settings.openai_api_key:
        return _chat_unavailable(model=model, reason="OPENAI_API_KEY chưa được cấu hình.")

    extracted_text = (document.extracted_text or "").strip()
    if not extracted_text:
        return _chat_unavailable(model=model, reason="Tài liệu chưa có văn bản trích xuất để làm ngữ cảnh.")

    excerpt, excerpt_note = _build_review_excerpt(
        extracted_text,
        max_chars=max(4000, settings.ai_chat_excerpt_chars),
    )
    messages = _build_chat_messages(
        document=document,
        question=question,
        history=history,
        risk_findings=risk_findings,
        user_profile=user_profile,
        excerpt=excerpt,
        excerpt_note=excerpt_note,
    )
    base_url = settings.openai_base_url.rstrip("/")
    url = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=httpx.Timeout(settings.openai_timeout_seconds)) as client:
            content = _post_chat_completion(
                client=client,
                url=url,
                headers=headers,
                model=model,
                messages=messages,
            )
    except Exception as exc:
        logger.warning("Document chat provider failed: %s", exc)
        return _chat_unavailable(model=model, reason="Không kết nối được AI provider hoặc provider trả lỗi.")

    if not content.strip():
        return _chat_unavailable(model=model, reason="AI provider trả về nội dung rỗng.")

    return DocumentChatResult(content=content.strip(), provider="chat_completions", model=model)


def _build_chat_messages(
    *,
    document: Document,
    question: str,
    history: list[DocumentChatMessage],
    risk_findings: list[RiskFinding],
    user_profile: UserProfile | None,
    excerpt: str,
    excerpt_note: str,
) -> list[dict[str, str]]:
    risk_payload = [
        {
            "rule_code": finding.rule_code,
            "severity": finding.severity,
            "snippet": finding.snippet,
            "suggestion": finding.suggestion,
        }
        for finding in risk_findings[:12]
    ]
    context = (
        "NGỮ CẢNH TÀI LIỆU ĐÃ ĐƯỢC RÀ SOÁT\n"
        f"- Tên file: {document.filename}\n"
        f"- Phân loại: {document.classification or 'chưa rõ'}\n"
        f"- Trạng thái rà soát: {document.review_status}\n"
        f"- Điểm rủi ro: {document.risk_score}\n"
        f"- Cờ rủi ro: {', '.join(document.flag_reasons or []) or 'không có'}\n\n"
        "TÓM TẮT / KẾT QUẢ RÀ SOÁT AI TRƯỚC ĐÓ\n"
        f"{_clip(document.summary or 'Chưa có tóm tắt rà soát.', 12000)}\n\n"
        "CÁC PHÁT HIỆN RỦI RO TỪ BỘ QUY TẮC\n"
        f"{json.dumps(risk_payload, ensure_ascii=False)}\n\n"
        "NGỮ CẢNH NGƯỜI DÙNG / HỒ SƠ KHÁCH HÀNG\n"
        f"{_format_user_profile_context(user_profile)}\n\n"
        "VĂN BẢN TRÍCH XUẤT LÀ NGUỒN SỰ THẬT CHÍNH\n"
        f"{excerpt}{excerpt_note}"
    )
    messages: list[dict[str, str]] = [
        {"role": "system", "content": _system_prompt()},
        {"role": "user", "content": context},
        {
            "role": "assistant",
            "content": "Đã nhận ngữ cảnh tài liệu. Tôi sẽ trả lời ngắn gọn, bám vào văn bản và nêu rõ nếu thiếu dữ kiện.",
        },
    ]
    for message in history[-10:]:
        role = "assistant" if message.role == "assistant" else "user"
        messages.append({"role": role, "content": _clip(message.content, 1800)})
    messages.append({"role": "user", "content": question.strip()})
    return messages


def _system_prompt() -> str:
    return (
        "Bạn là AI pháp lý hỗ trợ người dùng hỏi tiếp về một tài liệu đã được tải lên và rà soát. "
        "Trả lời bằng tiếng Việt, ngắn gọn nhưng có căn cứ. Chỉ dựa trên ngữ cảnh tài liệu, "
        "các phát hiện rủi ro, kết quả rà soát trước đó và lịch sử trao đổi được cung cấp.\n\n"
        "Quy tắc bắt buộc:\n"
        "- Ưu tiên trả lời trực tiếp câu hỏi của người dùng, không tóm tắt lại toàn bộ tài liệu nếu người dùng không hỏi.\n"
        "- Dùng ngữ cảnh người dùng để điều chỉnh mức chi tiết, ưu tiên rủi ro, phương án xử lý và cách diễn đạt; không tự suy đoán thông tin cá nhân ngoài hồ sơ.\n"
        "- Khi nêu rủi ro/điều khoản, trích 1-3 đoạn ngắn nguyên văn trong dấu “...” nếu ngữ cảnh có bằng chứng.\n"
        "- Nếu không thấy điều khoản hoặc thiếu file nền/phụ lục, nói rõ 'chưa đủ dữ kiện' và nêu cần kiểm tra gì.\n"
        "- Không bịa số điều khoản, luật áp dụng, cam kết, bên tham gia, ngày tháng hoặc kết luận pháp lý không có trong ngữ cảnh.\n"
        "- Không dùng câu chung chung kiểu 'cần người rà soát xử lý' trừ khi giải thích cụ thể điểm nào làm tăng rủi ro.\n"
        "- Tránh chêm từ tiếng Anh trong phần diễn giải; dùng tiếng Việt như điểm rủi ro, phát hiện, người rà soát, tài sản bảo đảm, sự kiện vi phạm.\n"
        "- Nếu câu hỏi ngoài phạm vi tài liệu, trả lời giới hạn và đề xuất người dùng cung cấp thêm tài liệu/thông tin.\n\n"
        "Định dạng ưu tiên:\n"
        "1. Kết luận ngắn: 1-2 câu.\n"
        "2. Căn cứ trong tài liệu: bullet có trích dẫn nếu có.\n"
        "3. Rủi ro / tác động thực tế: bullet ngắn.\n"
        "4. Việc nên làm tiếp: 1-4 việc cụ thể.\n"
        "Không dùng bảng trừ khi user yêu cầu."
    )


def _post_chat_completion(
    *,
    client: httpx.Client,
    url: str,
    headers: dict[str, str],
    model: str,
    messages: list[dict[str, str]],
) -> str:
    base_payload: dict[str, object] = {
        "model": model,
        "messages": messages,
        "temperature": 0.18,
        "max_tokens": 1800,
    }
    variants = [
        base_payload,
        {key: value for key, value in base_payload.items() if key != "max_tokens"},
        {key: value for key, value in base_payload.items() if key not in {"max_tokens", "temperature"}},
    ]
    last_response: httpx.Response | None = None
    for index, payload in enumerate(variants):
        response = client.post(url, headers=headers, json=payload)
        last_response = response
        if response.status_code in {400, 422} and index < len(variants) - 1:
            continue
        response.raise_for_status()
        parsed = response.json()
        content = _extract_assistant_content(parsed)
        if content is not None:
            return content
    if last_response is not None:
        last_response.raise_for_status()
    raise ValueError("Chat completion response did not include assistant content")


def _extract_assistant_content(payload: object) -> str | None:
    if not isinstance(payload, dict):
        return None
    try:
        content = payload["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return None
    return content if isinstance(content, str) else None


def _chat_unavailable(*, model: str | None, reason: str) -> DocumentChatResult:
    return DocumentChatResult(
        content=(
            "Hiện tại AI chat chưa khả dụng cho tài liệu này.\n\n"
            f"Lý do kỹ thuật: {reason}\n\n"
            "Mình không trả lời bằng mẫu chung vì dễ làm bạn hiểu nhầm là đã phân tích nội dung file. "
            "Bạn kiểm tra lại cấu hình AI provider rồi gửi lại câu hỏi, hệ thống sẽ trả lời theo đúng văn bản trích xuất."
        ),
        provider="unavailable",
        model=model,
    )


def _clip(value: str, max_chars: int) -> str:
    text = value.strip()
    if len(text) <= max_chars:
        return text
    return f"{text[:max_chars].rstrip()}\n...[đã rút gọn]"


def _format_user_profile_context(profile: UserProfile | None) -> str:
    if profile is None:
        return "Chưa có hồ sơ người dùng. Trả lời theo ngữ cảnh tài liệu và tránh cá nhân hóa quá mức."

    rows = [
        ("Họ tên", profile.full_name),
        ("Nhóm tuổi", profile.age_range),
        ("Nghề nghiệp", profile.occupation),
        ("Tổ chức/công ty", profile.organization),
        ("Lĩnh vực", profile.industry),
        ("Khu vực pháp lý thường gặp", profile.jurisdiction),
        ("Vai trò trong vụ việc", profile.role_in_matters),
        ("Ưu tiên pháp lý", profile.legal_priority),
        ("Khẩu vị rủi ro", profile.risk_tolerance),
        ("Ngôn ngữ ưu tiên", profile.preferred_language),
        ("Giọng tư vấn", profile.preferred_tone),
        ("Ghi chú thêm", profile.notes),
    ]
    lines = [f"- {label}: {value}" for label, value in rows if value]
    return "\n".join(lines) if lines else "Hồ sơ người dùng đã tạo nhưng chưa có thông tin đáng kể."
