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

function tooLarge(): JsonBodyResult {
  return { ok: false, response: apiError(413, "PAYLOAD_TOO_LARGE", "Request body is too large") };
}

/** Reads the body as UTF-8, stopping (and returning `null`) as soon as it exceeds `limit` bytes. */
async function readTextWithLimit(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
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

  // Reject on the declared length first, then enforce while streaming (chunked bodies have no length).
  if (Number(request.headers.get("content-length") ?? 0) > MAX_JSON_BODY_BYTES) {
    return tooLarge();
  }
  const text = await readTextWithLimit(request, MAX_JSON_BODY_BYTES);
  if (text === null) {
    return tooLarge();
  }

  try {
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: apiError(400, "INVALID_JSON", "Request body must be valid JSON") };
  }
}
