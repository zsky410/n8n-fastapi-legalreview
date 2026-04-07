import logging
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.schemas.error import ErrorDetail, ErrorResponse

logger = logging.getLogger(__name__)


def _request_id(request: Request) -> str:
    request_id = getattr(request.state, "request_id", None)

    return request_id or request.headers.get("X-Request-ID") or str(uuid.uuid4())


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        details = [
            ErrorDetail(
                code=error.get("type", "validation_error"),
                message=error.get("msg", "Invalid request."),
                field=".".join(str(item) for item in error.get("loc", []) if item != "body") or None,
            )
            for error in exc.errors()
        ]

        payload = ErrorResponse(
            error="validation_error",
            message="Request validation failed.",
            details=details,
            requestId=_request_id(request),
        )

        return JSONResponse(status_code=422, content=payload.model_dump())

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        message = exc.detail if isinstance(exc.detail, str) else "The request could not be completed."
        payload = ErrorResponse(
            error="http_error",
            message=message,
            details=[],
            requestId=_request_id(request),
        )

        return JSONResponse(status_code=exc.status_code, content=payload.model_dump())

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled application error: %s", exc)

        payload = ErrorResponse(
            error="internal_error",
            message="An unexpected server error occurred.",
            details=[],
            requestId=_request_id(request),
        )

        return JSONResponse(status_code=500, content=payload.model_dump())
