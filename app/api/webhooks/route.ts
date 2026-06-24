import { NextResponse } from "next/server";

import * as hsc from "@/lib/hsc/client";

export async function POST(req: Request) {
  const body = (await req.json()) as { url: string; events: string[]; description?: string };
  try {
    return NextResponse.json(await hsc.webhooks.register(body));
  } catch (e) {
    if (e instanceof hsc.HscApiError) {
      return NextResponse.json({ code: e.code, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ message: String(e) }, { status: 500 });
  }
}
