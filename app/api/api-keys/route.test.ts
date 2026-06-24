/**
 * BFF route test for API-key minting. The route is a thin passthrough to the
 * typed client; we assert success passthrough and the two error mappings
 * (HscApiError → upstream status, other → 500).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import * as hsc from "@/lib/hsc/client";

import { POST } from "./route";

function jsonReq(body: unknown): Request {
  return new Request("http://test/api/api-keys", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("POST /api/api-keys", () => {
  it("returns the created key on success", async () => {
    vi.spyOn(hsc.apiKeys, "create").mockResolvedValue({
      id: "k1",
      label: "ci",
      key_id: "hsk_pub",
      key_secret: "hsk_secret",
      prop_account_id: null,
    });
    const res = await POST(jsonReq({ label: "ci" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ id: "k1", key_secret: "hsk_secret" });
  });

  it("maps an HscApiError to its upstream status + code", async () => {
    vi.spyOn(hsc.apiKeys, "create").mockRejectedValue(
      new hsc.HscApiError(403, "V2_FORBIDDEN", "nope"),
    );
    const res = await POST(jsonReq({ label: "ci" }));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ code: "V2_FORBIDDEN", message: "nope" });
  });

  it("maps an unexpected error to 500", async () => {
    vi.spyOn(hsc.apiKeys, "create").mockRejectedValue(new Error("kaboom"));
    const res = await POST(jsonReq({ label: "ci" }));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ message: "kaboom" });
  });
});
