import "server-only";
import type { ApiErrorBody } from "@/lib/types";

const MAX_JSON_BODY_BYTES = 16 * 1024;

/** Error response in the spec §6 format. Never put stack traces or internal details in `message`. */
export function apiError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): Response {
  const body: ApiErrorBody = { error: { code, message, ...(details ? { details } : {}) } };
  return Response.json(body, { status });
}

/** `Origin: null` (sandboxed frames, some redirects) is not parseable and counts as foreign. */
function isSameHost(origin: string, requestUrl: string): boolean {
  try {
    return new URL(origin).host === new URL(requestUrl).host;
  } catch {
    return false;
  }
}

type JsonBodyResult = { ok: true; body: unknown } | { ok: false; response: Response };

/**
 * Reads a JSON request body for a mutation.
 *
 * - Requires `Content-Type: application/json`. Browsers can't send that cross-site without a
 *   CORS preflight, so a hostile page can't forge the request with a plain HTML form (CSRF).
 * - Rejects requests whose `Origin` header points at a different host.
 * - Caps the body size before parsing.
 */
export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return { ok: false, response: apiError(415, "UNSUPPORTED_MEDIA_TYPE", "Send JSON") };
  }

  const origin = request.headers.get("origin");
  if (origin !== null && !isSameHost(origin, request.url)) {
    return { ok: false, response: apiError(403, "FORBIDDEN", "Cross-origin request rejected") };
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_JSON_BODY_BYTES) {
    return { ok: false, response: apiError(413, "PAYLOAD_TOO_LARGE", "Request body is too large") };
  }

  try {
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: apiError(400, "INVALID_JSON", "Request body must be valid JSON") };
  }
}
