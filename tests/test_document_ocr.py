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


def test_document_ocr_uses_ocrmypdf_for_pdf_upload() -> None:
    with (
        patch(
            "app.services.document_ocr_service.extract_pdf_text",
            return_value="",
        ),
        patch(
            "app.services.document_ocr_service.ocrmypdf.ocr",
            side_effect=lambda _input, _output, *, sidecar, **_kwargs: sidecar.write_text(
                "Hợp đồng có điều khoản thanh toán, phạt vi phạm và giải quyết tranh chấp.",
                encoding="utf-8",
            ),
        ) as mock_ocr,
    ):
        response = client.post(
            "/v1/legal/ocr",
            files={"file": ("sample.pdf", b"%PDF-1.4 sample", "application/pdf")},
            data={"language": "vi"},
        )

    assert response.status_code == 200
    payload = response.json()

    assert payload["provider"] == "ocrmypdf"
    assert payload["source"] == "ocrmypdf_pdf"
    assert "giải quyết tranh chấp" in payload["extractedText"]
    assert mock_ocr.call_count == 1


def test_document_ocr_prefers_native_pdf_text_when_ocr_sidecar_only_contains_skip_note() -> None:
    with (
        patch(
            "app.services.document_ocr_service.extract_pdf_text",
            return_value="Nội dung hợp đồng lao động với điều khoản lương, bảo mật và chấm dứt.",
        ),
        patch(
            "app.services.document_ocr_service.ocrmypdf.ocr",
            side_effect=AssertionError("OCRmyPDF should not be called when native text is already usable."),
        ),
    ):
        response = client.post(
            "/v1/legal/ocr",
            files={"file": ("sample.pdf", b"%PDF-1.4 sample", "application/pdf")},
            data={"language": "vi"},
        )

    assert response.status_code == 200
    payload = response.json()

    assert payload["provider"] == "local"
    assert payload["source"] == "pdf_text"
    assert "điều khoản lương" in payload["extractedText"]


def test_document_ocr_uses_tesseract_for_image_upload() -> None:
    png_1x1 = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDAT\x08\x99c```\x00\x00\x00\x04\x00\x01"
        b"\x0b\xe7\x02\x9d\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    with patch(
        "app.services.document_ocr_service.pytesseract.image_to_string",
        return_value="Dieu khoan cham dut va boi thuong duoc neu trong van ban scan.",
    ) as mock_ocr:
        response = client.post(
            "/v1/legal/ocr",
            files={"file": ("sample.png", png_1x1, "image/png")},
            data={"language": "vi"},
        )

    assert response.status_code == 200
    payload = response.json()

    assert payload["provider"] == "tesseract"
    assert payload["source"] == "tesseract_image"
    assert "boi thuong" in payload["extractedText"]
    assert mock_ocr.call_count == 1
