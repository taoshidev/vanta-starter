import { NextResponse } from "next/server";

import * as hsc from "@/lib/hsc/client";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    return NextResponse.json(await hsc.webhooks.remove(id));
  } catch (e) {
    if (e instanceof hsc.HscApiError) {
      return NextResponse.json({ code: e.code, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ message: String(e) }, { status: 500 });
  }
}
