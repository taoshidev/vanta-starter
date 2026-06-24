import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import * as hsc from "@/lib/hsc/client";

import {
  createCheckoutAction,
  createFreeAccountAction,
  getKycStatusAction,
  getSumsubTokenAction,
  listPropAccountsAction,
} from "./onboarding";

const PROP = {
  id: "p1",
  tier_id: "starter",
  asset_class: "crypto",
  account_size: 50_000,
  status: "active",
  subaccount_id: null,
  subaccount_uuid: null,
  synthetic_hotkey: null,
  stripe_payment_intent_id: null,
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("onboarding actions", () => {
  it("getKycStatusAction returns the status payload", async () => {
    vi.spyOn(hsc.kyc, "status").mockResolvedValue({
      user_id: "u1",
      kyc_provider: "sumsub",
      kyc_status: "verified",
      kyc_verified_at: "2026-01-01",
      kyc_failure_reason: null,
    });
    const r = await getKycStatusAction();
    expect(r).toMatchObject({ ok: true, data: { kyc_status: "verified" } });
  });

  it("getSumsubTokenAction maps a not-configured error", async () => {
    vi.spyOn(hsc.kyc, "sumsubToken").mockRejectedValue(
      new hsc.HscApiError(400, "V2_SUMSUB_NOT_CONFIGURED", "no"),
    );
    const r = await getSumsubTokenAction();
    expect(r).toMatchObject({ ok: false, code: "V2_SUMSUB_NOT_CONFIGURED" });
  });

  it("createCheckoutAction forwards the input and returns the intent", async () => {
    const input = {
      tier_id: "starter",
      market: "all",
      asset_class: "crypto",
      account_size: 50_000,
      amount_cents: 9900,
    };
    const spy = vi.spyOn(hsc.payments, "checkout").mockResolvedValue({
      payment_id: "pay_1",
      stripe_payment_intent_id: "pi_1",
      client_secret: "cs_1",
      amount_cents: 9900,
      currency: "usd",
      status: "requires_payment_method",
    });
    const r = await createCheckoutAction(input);
    expect(spy).toHaveBeenCalledWith(input);
    expect(r).toMatchObject({ ok: true, data: { client_secret: "cs_1" } });
  });

  it("createFreeAccountAction returns the provisioned account", async () => {
    vi.spyOn(hsc.payments, "freeAccount").mockResolvedValue(PROP);
    const r = await createFreeAccountAction({
      tier_id: "free",
      asset_class: "crypto",
      account_size: 25_000,
    });
    expect(r).toMatchObject({ ok: true, data: { id: "p1" } });
  });

  it("listPropAccountsAction returns the account list", async () => {
    vi.spyOn(hsc.payments, "listPropAccounts").mockResolvedValue([PROP]);
    const r = await listPropAccountsAction();
    expect(r).toMatchObject({ ok: true });
    expect((r as { ok: true; data: unknown[] }).data).toHaveLength(1);
  });
});
