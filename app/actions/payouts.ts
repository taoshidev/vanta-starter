"use server";

import * as hsc from "@/lib/hsc/client";

import type { ActionResult } from "./auth";

function failure(e: unknown): ActionResult {
  if (e instanceof hsc.HscApiError) return { ok: false, code: e.code, message: e.message };
  return { ok: false, code: "UNKNOWN", message: e instanceof Error ? e.message : "Unknown error" };
}

export async function createConnectAccountAction(country = "US") {
  try {
    return { ok: true as const, data: await hsc.connect.createAccount(country) };
  } catch (e) {
    return failure(e);
  }
}

export async function listConnectAccountsAction() {
  try {
    return { ok: true as const, data: await hsc.connect.list() };
  } catch (e) {
    return failure(e);
  }
}

export async function refreshConnectLinkAction(stripeAccountId: string) {
  try {
    return { ok: true as const, data: await hsc.connect.refreshLink(stripeAccountId) };
  } catch (e) {
    return failure(e);
  }
}

export async function requestPayoutAction(amount_cents: number, prop_account_id?: string) {
  try {
    return {
      ok: true as const,
      data: await hsc.payouts.request({ amount_cents, prop_account_id }),
    };
  } catch (e) {
    return failure(e);
  }
}

export async function listPayoutsAction() {
  try {
    return { ok: true as const, data: await hsc.payouts.list() };
  } catch (e) {
    return failure(e);
  }
}

export async function getPayoutEstimateAction(propAccountId?: string) {
  try {
    return { ok: true as const, data: await hsc.payouts.estimate(propAccountId) };
  } catch (e) {
    return failure(e);
  }
}
