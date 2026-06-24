"use server";

import { hscConfig } from "@/lib/hsc/config";

import type { ActionResult } from "./auth";

/**
 * Submit a public self-service API access request.
 *
 * This is the one call that does NOT use the app's OAuth client — the requester
 * is an anonymous prospective tenant. It posts straight to the public
 * `POST /v2/app-requests` endpoint; an operator approves it later in the admin
 * console, which emails the requester a one-time credential link.
 */
export async function requestAccessAction(
  formData: FormData,
): Promise<ActionResult<{ requestId: string }>> {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const payload = {
    company_name: str("company_name"),
    slug: str("slug"),
    contact_email: str("contact_email"),
    contact_name: str("contact_name") || null,
    website: str("website") || null,
    use_case: str("use_case") || null,
  };

  try {
    const res = await fetch(`${hscConfig.baseUrl}/v2/app-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      let code = "REQUEST_FAILED";
      let message = "We couldn't submit your request. Please try again.";
      try {
        const body = await res.json();
        const detail = body?.detail;
        if (detail && typeof detail === "object" && !Array.isArray(detail) && detail.message) {
          code = detail.code ?? code;
          message = detail.message;
        } else if (Array.isArray(detail) && detail[0]?.msg) {
          code = "VALIDATION";
          message = detail[0].msg;
        }
      } catch {
        // non-JSON error body — keep the default message
      }
      return { ok: false, code, message };
    }

    const data = (await res.json()) as { request_id: string };
    return { ok: true, data: { requestId: data.request_id } };
  } catch (e) {
    return {
      ok: false,
      code: "NETWORK",
      message: e instanceof Error ? e.message : "Network error",
    };
  }
}
