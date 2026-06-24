/**
 * Unit test for the inbound webhook signature verification.
 *
 * Mirrors the python implementation in hyperscaled_api/v2/security/signing.py.
 */
import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { POST } from "@/app/api/hsc-webhook/route";

const SECRET = "wh_test_secret";

function makeReq(body: object, options?: { skewSeconds?: number; tamperSig?: boolean }) {
  const payload = Buffer.from(JSON.stringify(body));
  const ts = Math.floor(Date.now() / 1000) + (options?.skewSeconds ?? 0);
  const signed = Buffer.concat([Buffer.from(`${ts}.`), payload]);
  let v1 = createHmac("sha256", SECRET).update(signed).digest("hex");
  if (options?.tamperSig) v1 = v1.replace(/.$/, v1.endsWith("0") ? "1" : "0");
  const headers = new Headers({
    "X-Hyperscaled-Signature": `t=${ts},v1=${v1}`,
    "Content-Type": "application/json",
  });
  return new Request("http://test/api/hsc-webhook", { method: "POST", body: payload, headers });
}

describe("hsc-webhook route", () => {
  it("accepts a valid signature", async () => {
    const r = await POST(makeReq({ type: "ping", data: {} }));
    expect(r.status).toBe(200);
  });

  it("rejects a tampered signature", async () => {
    const r = await POST(makeReq({ type: "ping", data: {} }, { tamperSig: true }));
    expect(r.status).toBe(400);
  });

  it("rejects an old timestamp", async () => {
    const r = await POST(makeReq({ type: "ping", data: {} }, { skewSeconds: -10_000 }));
    expect(r.status).toBe(400);
  });
});
