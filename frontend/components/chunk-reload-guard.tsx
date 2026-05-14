"use client";

import { useEffect } from "react";

const RECOVERY_KEY = "legalreview_chunk_recovered_at";
const RECOVERY_COOLDOWN_MS = 60_000;

const chunkMessagePatterns = [
  "chunkloaderror",
  "loading chunk",
  "failed to fetch dynamically imported module",
  "importing a module script failed",
  "module script failed",
];

function hasChunkPath(value: unknown): boolean {
  return typeof value === "string" && value.includes("/_next/static/chunks/");
}

function hasChunkMessage(value: unknown): boolean {
  if (!value) {
    return false;
  }

  const message =
    value instanceof Error
      ? `${value.name} ${value.message}`
      : typeof value === "string"
        ? value
        : typeof value === "object" && "message" in value
          ? String((value as { message?: unknown }).message)
          : "";

  const normalized = message.toLowerCase();
  return chunkMessagePatterns.some((pattern) => normalized.includes(pattern));
}

function isChunkResourceTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const source =
    target instanceof HTMLScriptElement
      ? target.src
      : target instanceof HTMLLinkElement
        ? target.href
        : "";

  return hasChunkPath(source);
}

function shouldRecoverFromError(event: Event): boolean {
  const errorEvent = event as ErrorEvent;

  return (
    hasChunkPath(errorEvent.filename) ||
    hasChunkMessage(errorEvent.error) ||
    hasChunkMessage(errorEvent.message) ||
    isChunkResourceTarget(event.target)
  );
}

function shouldRecoverFromRejection(event: PromiseRejectionEvent): boolean {
  return hasChunkMessage(event.reason) || hasChunkPath(String(event.reason ?? ""));
}

function recoverOnce() {
  const now = Date.now();
  const lastRecoveredAt = Number(window.sessionStorage.getItem(RECOVERY_KEY) ?? "0");

  if (lastRecoveredAt && now - lastRecoveredAt < RECOVERY_COOLDOWN_MS) {
    return;
  }

  window.sessionStorage.setItem(RECOVERY_KEY, String(now));
  window.location.reload();
}

export function ChunkReloadGuard() {
  useEffect(() => {
    function handleError(event: Event) {
      if (shouldRecoverFromError(event)) {
        recoverOnce();
      }
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      if (shouldRecoverFromRejection(event)) {
        recoverOnce();
      }
    }

    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
