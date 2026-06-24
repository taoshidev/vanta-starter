/**
 * BFF route for API-key minting — pure passthrough to the v2 API so the
 * client can pop a single-fetch dialog without re-rendering the page.
 */
import { NextResponse } from "next/server";

import * as hsc from "@/lib/hsc/client";

export async function POST(req: Request) {
  const body = (await req.json()) as { label: string; prop_account_id?: string };
  try {
    const created = await hsc.apiKeys.create(body);
    return NextResponse.json(created);
  } catch (e) {
    if (e instanceof hsc.HscApiError) {
      return NextResponse.json({ code: e.code, message: e.message }, { status: e.status });
    }
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
