"use server";

import * as hsc from "@/lib/hsc/client";

import type { ActionResult } from "./auth";

function failure(e: unknown): ActionResult {
  if (e instanceof hsc.HscApiError) return { ok: false, code: e.code, message: e.message };
  return { ok: false, code: "UNKNOWN", message: e instanceof Error ? e.message : "Unknown error" };
}

export async function deskPollAction(propAccountId?: string) {
  try {
    return { ok: true as const, data: await hsc.trading.deskPoll(propAccountId) };
  } catch (e) {
    return failure(e);
  }
}

export async function submitOrderAction(
  body: {
    trade_pair: string;
    order_type: "LONG" | "SHORT" | "FLAT";
    leverage?: number;
    value?: number;
    quantity?: number;
    execution_type?: "MARKET" | "LIMIT" | "STOP_LIMIT" | "BRACKET";
    limit_price?: number;
    stop_price?: number;
    take_profit?: number;
    stop_loss?: number;
  },
  propAccountId?: string,
) {
  try {
    return { ok: true as const, data: await hsc.trading.submit(body, propAccountId) };
  } catch (e) {
    return failure(e);
  }
}

export async function closePositionAction(trade_pair: string, propAccountId?: string) {
  try {
    return { ok: true as const, data: await hsc.trading.close(trade_pair, propAccountId) };
  } catch (e) {
    return failure(e);
  }
}

export async function bulkClosePositionsAction(
  position_uuids: string[],
  propAccountId?: string,
) {
  try {
    return { ok: true as const, data: await hsc.trading.bulkClose(position_uuids, propAccountId) };
  } catch (e) {
    return failure(e);
  }
}

export async function cancelOrderAction(
  order_uuid: string,
  trade_pair: string,
  propAccountId?: string,
) {
  try {
    return { ok: true as const, data: await hsc.trading.cancel(order_uuid, trade_pair, propAccountId) };
  } catch (e) {
    return failure(e);
  }
}

export async function editOrderAction(
  order_uuid: string,
  body: Record<string, unknown>,
  propAccountId?: string,
) {
  try {
    return { ok: true as const, data: await hsc.trading.edit(order_uuid, body, propAccountId) };
  } catch (e) {
    return failure(e);
  }
}

export async function setTpSlAction(body: Record<string, unknown>, propAccountId?: string) {
  try {
    return { ok: true as const, data: await hsc.trading.tpSl(body, propAccountId) };
  } catch (e) {
    return failure(e);
  }
}
