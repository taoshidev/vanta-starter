/**
 * Example consumer for hyperscaled-api outbound webhooks.
 *
 * Verifies the `X-Hyperscaled-Signature` HMAC-SHA256 header against the
 * endpoint secret(s) in HSC_WEBHOOK_SECRET.
 *
 * Two things this handler gets right that a naive implementation does not, and
 * both matter during a secret rotation:
 *
 *   1. The header can carry SEVERAL `v1=` signatures:
 *
 *        X-Hyperscaled-Signature: t=1730000000,v1=<new>,v1=<previous>
 *
 *      During a rotation's grace window the API signs each delivery with both
 *      the new and the not-yet-expired previous secret. Parsing the header with
 *      `Object.fromEntries` silently keeps only the LAST `v1=` — so a partner
 *      who has correctly moved to the new secret would reject every delivery
 *      for the whole window. Collect them all and accept if ANY matches.
 *
 *   2. HSC_WEBHOOK_SECRET may itself be a comma-separated list, so you can
 *      accept the old and new secret simultaneously while you roll over. Try
 *      every secret against every signature.
 *
 * Replace the in-handler `console.log` with whatever side-effect makes sense
 * for your app (DB update, email send, slack notification, ...).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

/** Accepts one secret or a comma-separated list (for rotation). */
const SECRETS = (process.env.HSC_WEBHOOK_SECRET ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const TOLERANCE_SECONDS = 300;

/** Parse `t=<unix>,v1=<hex>[,v1=<hex>...]` into a timestamp and every signature. */
function parseSignatureHeader(header: string): { ts: number; signatures: string[] } | null {
  let ts: number | null = null;
  const signatures: string[] = [];

  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "t") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) ts = parsed;
    } else if (key === "v1") {
      signatures.push(value);
    }
  }

  if (ts === null || signatures.length === 0) return null;
  return { ts, signatures };
}

function matches(expected: string, candidate: string): boolean {
  // timingSafeEqual throws on a length mismatch, so guard first.
  if (expected.length !== candidate.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(candidate));
}

function verify(signature: string, body: Buffer): boolean {
  if (SECRETS.length === 0) return false;

  const parsed = parseSignatureHeader(signature);
  if (!parsed) return false;

  // Reject replays. The timestamp is part of the signed payload, so it cannot
  // be altered without invalidating every signature.
  if (Math.abs(Date.now() / 1000 - parsed.ts) > TOLERANCE_SECONDS) return false;

  const signed = Buffer.concat([Buffer.from(`${parsed.ts}.`), body]);

  for (const secret of SECRETS) {
    const expected = createHmac("sha256", secret).update(signed).digest("hex");
    for (const candidate of parsed.signatures) {
      if (matches(expected, candidate)) return true;
    }
  }
  return false;
}

export async function POST(req: Request) {
  const body = Buffer.from(await req.arrayBuffer());
  const signature = req.headers.get("X-Hyperscaled-Signature") ?? "";
  if (!verify(signature, body)) {
    return NextResponse.json({ ok: false, reason: "invalid signature" }, { status: 400 });
  }
  const event = JSON.parse(body.toString());
  console.log("[hsc-webhook]", event.type, event.data);
  // ▶︎ TODO: handle the event for your application here.
  return NextResponse.json({ ok: true });
}
