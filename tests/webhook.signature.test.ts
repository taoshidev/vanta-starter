/**
 * Unit test for the inbound webhook signature verification.
 *
 * Mirrors the python implementation in hyperscaled_api/v2/security/signing.py,
 * including the rotation grace window where the API signs one delivery with
 * several secrets and emits one `v1=` per secret.
 */
import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { POST } from "@/app/api/hsc-webhook/route";

const SECRET = "wh_test_secret";
/** The other half of a rotation — configured on the API but not (yet) here. */
const OTHER_SECRET = "wh_rotated_secret";

function sign(secret: string, ts: number, payload: Buffer): string {
  const signed = Buffer.concat([Buffer.from(`${ts}.`), payload]);
  return createHmac("sha256", secret).update(signed).digest("hex");
}

function makeReq(
  body: object,
  options?: {
    skewSeconds?: number;
    tamperSig?: boolean;
    /** Secrets the *sender* signs with, in header order. Defaults to [SECRET]. */
    signWith?: string[];
    rawHeader?: string;
  },
) {
  const payload = Buffer.from(JSON.stringify(body));
  const ts = Math.floor(Date.now() / 1000) + (options?.skewSeconds ?? 0);
  const secrets = options?.signWith ?? [SECRET];
  const sigs = secrets.map((s) => {
    let v1 = sign(s, ts, payload);
    if (options?.tamperSig) v1 = v1.replace(/.$/, v1.endsWith("0") ? "1" : "0");
    return v1;
  });
  const header = options?.rawHeader ?? `t=${ts},${sigs.map((v) => `v1=${v}`).join(",")}`;
  const headers = new Headers({
    "X-Hyperscaled-Signature": header,
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

  // ── Rotation grace window ────────────────────────────────────────────────
  // The API signs with every currently-active secret and emits one `v1=` per
  // secret. A verifier that parses the header with Object.fromEntries keeps
  // only the LAST v1= and rejects 100% of deliveries for the whole window.

  it("accepts when our secret signed the FIRST of several v1 signatures", async () => {
    const r = await POST(
      makeReq({ type: "ping", data: {} }, { signWith: [SECRET, OTHER_SECRET] }),
    );
    expect(r.status).toBe(200);
  });

  it("accepts when our secret signed the LAST of several v1 signatures", async () => {
    const r = await POST(
      makeReq({ type: "ping", data: {} }, { signWith: [OTHER_SECRET, SECRET] }),
    );
    expect(r.status).toBe(200);
  });

  it("rejects when none of the v1 signatures are ours", async () => {
    const r = await POST(
      makeReq({ type: "ping", data: {} }, { signWith: [OTHER_SECRET, "wh_third"] }),
    );
    expect(r.status).toBe(400);
  });

  // ── Malformed headers must not throw ─────────────────────────────────────

  it("rejects a header with no v1", async () => {
    const r = await POST(makeReq({ type: "ping", data: {} }, { rawHeader: "t=1730000000" }));
    expect(r.status).toBe(400);
  });

  it("rejects a v1 of the wrong length without throwing", async () => {
    // timingSafeEqual throws on a length mismatch — the guard must come first.
    const r = await POST(
      makeReq({ type: "ping", data: {} }, { rawHeader: `t=${Math.floor(Date.now() / 1000)},v1=ab` }),
    );
    expect(r.status).toBe(400);
  });

  it("rejects an empty header", async () => {
    const r = await POST(makeReq({ type: "ping", data: {} }, { rawHeader: "" }));
    expect(r.status).toBe(400);
  });
});
