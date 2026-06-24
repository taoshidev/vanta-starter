import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import * as hsc from "@/lib/hsc/client";

import { POST } from "./route";
import { DELETE } from "./[id]/route";

function jsonReq(body: unknown): Request {
  return new Request("http://test/api/webhooks", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("POST /api/webhooks", () => {
  it("registers an endpoint and returns it", async () => {
    const spy = vi.spyOn(hsc.webhooks, "register").mockResolvedValue({
      id: "wh1",
      url: "https://app/hook",
      events: ["payout.completed"],
      active: true,
      description: null,
      secret: "whsec_x",
    });
    const body = { url: "https://app/hook", events: ["payout.completed"] };
    const res = await POST(jsonReq(body));
    expect(spy).toHaveBeenCalledWith(body);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ id: "wh1", secret: "whsec_x" });
  });

  it("maps an HscApiError to its upstream status", async () => {
    vi.spyOn(hsc.webhooks, "register").mockRejectedValue(
      new hsc.HscApiError(422, "V2_INVALID_URL", "bad url"),
    );
    const res = await POST(jsonReq({ url: "x", events: [] }));
    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toEqual({ code: "V2_INVALID_URL", message: "bad url" });
  });
});

describe("DELETE /api/webhooks/[id]", () => {
  it("removes the endpoint by id", async () => {
    const spy = vi.spyOn(hsc.webhooks, "remove").mockResolvedValue({ deactivated: true });
    const res = await DELETE(new Request("http://test/api/webhooks/wh1", { method: "DELETE" }), {
      params: Promise.resolve({ id: "wh1" }),
    });
    expect(spy).toHaveBeenCalledWith("wh1");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ deactivated: true });
  });

  it("maps an HscApiError to its upstream status", async () => {
    vi.spyOn(hsc.webhooks, "remove").mockRejectedValue(
      new hsc.HscApiError(404, "V2_NOT_FOUND", "missing"),
    );
    const res = await DELETE(new Request("http://test/api/webhooks/none", { method: "DELETE" }), {
      params: Promise.resolve({ id: "none" }),
    });
    expect(res.status).toBe(404);
  });
});
