from __future__ import annotations

import hashlib
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
CHUNK_SIZE = 1024 * 1024


def store_upload(file: UploadFile, *, user_id: uuid.UUID) -> tuple[str, int, str]:
    filename = file.filename or "document"
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are supported",
        )

    upload_root = Path(settings.upload_dir)
    upload_root.mkdir(parents=True, exist_ok=True)
    user_dir = upload_root / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)

    storage_name = f"{uuid.uuid4()}{suffix}"
    storage_path = user_dir / storage_name
    temp_path = user_dir / f".{storage_name}.tmp"
    digest = hashlib.sha256()
    size_bytes = 0

    try:
        with temp_path.open("wb") as output_file:
            while chunk := file.file.read(CHUNK_SIZE):
                size_bytes += len(chunk)
                if size_bytes > settings.max_upload_size_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Uploaded file exceeds the 10MB size limit",
                    )
                digest.update(chunk)
                output_file.write(chunk)

        if size_bytes == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty",
            )

        temp_path.replace(storage_path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise

    sha256 = digest.hexdigest()
    return str(storage_path), size_bytes, sha256
