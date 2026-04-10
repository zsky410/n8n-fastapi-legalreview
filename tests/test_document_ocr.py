import io
import zipfile
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def build_minimal_docx_bytes(text: str) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr(
            "[Content_Types].xml",
            """<?xml version="1.0" encoding="UTF-8"?>
            <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
              <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
            </Types>""",
        )
        archive.writestr(
            "word/document.xml",
            f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
              <w:body>
                <w:p><w:r><w:t>{text}</w:t></w:r></w:p>
              </w:body>
            </w:document>""",
        )
    return buffer.getvalue()


def test_document_ocr_reads_plain_text_upload() -> None:
    response = client.post(
        "/v1/legal/ocr",
        files={"file": ("sample.txt", b"Dieu khoan phat va giai quyet tranh chap duoc neu ro trong hop dong.", "text/plain")},
        data={"language": "vi"},
    )

    assert response.status_code == 200
    payload = response.json()

    assert payload["fileName"] == "sample.txt"
    assert payload["provider"] == "local"
    assert payload["source"] == "direct_text"
    assert "giai quyet tranh chap" in payload["extractedText"]


def test_document_ocr_reads_docx_upload() -> None:
    response = client.post(
        "/v1/legal/ocr",
        files={
            "file": (
                "sample.docx",
                build_minimal_docx_bytes("Hop dong mau voi dieu khoan cham dut va phat vi pham."),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
        data={"language": "vi"},
    )

    assert response.status_code == 200
    payload = response.json()

    assert payload["provider"] == "local"
    assert payload["source"] == "docx_xml"
    assert "cham dut" in payload["extractedText"]


def test_document_ocr_uses_gemini_for_pdf_upload() -> None:
    with (
        patch("app.services.gemini_client.GeminiClient.is_enabled", return_value=True),
        patch(
            "app.services.gemini_client.GeminiClient.extract_text_from_file",
            return_value="Hợp đồng có điều khoản thanh toán, phạt vi phạm và giải quyết tranh chấp.",
        ) as mock_extract,
    ):
        response = client.post(
            "/v1/legal/ocr",
            files={"file": ("sample.pdf", b"%PDF-1.4 sample", "application/pdf")},
            data={"language": "vi"},
        )

    assert response.status_code == 200
    payload = response.json()

    assert payload["provider"] == "gemini"
    assert payload["source"] == "gemini_file_ocr"
    assert "giải quyết tranh chấp" in payload["extractedText"]
    assert mock_extract.call_count == 1
