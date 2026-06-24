/**
 * Example consumer for hyperscaled-api outbound webhooks.
 *
 * Verifies the `X-Hyperscaled-Signature: t={ts},v1={hex}` HMAC-SHA256
 * signature against the endpoint secret stored in HSC_WEBHOOK_SECRET.
 *
 * Replace the in-handler `console.log` with whatever side-effect makes sense
 * for your app (DB update, email send, slack notification, ...).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

const SECRET = process.env.HSC_WEBHOOK_SECRET ?? "";
const TOLERANCE_SECONDS = 300;

function verify(signature: string, body: Buffer): boolean {
  if (!SECRET) return false;
  const parts = Object.fromEntries(signature.split(",").map((s) => s.split("=") as [string, string]));
  const ts = Number(parts.t);
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  if (Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) return false;
  const signed = Buffer.concat([Buffer.from(`${ts}.`), body]);
  const expected = createHmac("sha256", SECRET).update(signed).digest("hex");
  if (expected.length !== v1.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
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
