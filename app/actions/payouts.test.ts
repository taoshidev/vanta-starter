import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import * as hsc from "@/lib/hsc/client";

import {
  createConnectAccountAction,
  getPayoutEstimateAction,
  listConnectAccountsAction,
  listPayoutsAction,
  refreshConnectLinkAction,
  requestPayoutAction,
} from "./payouts";

const PAYOUT = {
  id: "po_1",
  amount_cents: 10_000,
  currency: "usd",
  status: "requested",
  stripe_transfer_id: null,
  failure_reason: null,
  requested_at: "2026-01-01",
  completed_at: null,
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("connect actions", () => {
  it("createConnectAccountAction defaults the country to US", async () => {
    const spy = vi.spyOn(hsc.connect, "createAccount").mockResolvedValue({
      id: "c1",
      stripe_account_id: "acct_1",
      onboarding_url: "https://stripe/onboard",
      status: "pending",
      payouts_enabled: false,
      charges_enabled: false,
      details_submitted: false,
    });
    await createConnectAccountAction();
    expect(spy).toHaveBeenCalledWith("US");
  });

  it("createConnectAccountAction forwards an explicit country", async () => {
    const spy = vi.spyOn(hsc.connect, "createAccount").mockResolvedValue({
      id: "c1",
      stripe_account_id: "acct_1",
      onboarding_url: "https://stripe/onboard",
      status: "pending",
      payouts_enabled: false,
      charges_enabled: false,
      details_submitted: false,
    });
    await createConnectAccountAction("GB");
    expect(spy).toHaveBeenCalledWith("GB");
  });

  it("listConnectAccountsAction returns the list", async () => {
    vi.spyOn(hsc.connect, "list").mockResolvedValue([]);
    await expect(listConnectAccountsAction()).resolves.toEqual({ ok: true, data: [] });
  });

  it("refreshConnectLinkAction forwards the stripe account id", async () => {
    const spy = vi
      .spyOn(hsc.connect, "refreshLink")
      .mockResolvedValue({ onboarding_url: "https://stripe/refresh" });
    await refreshConnectLinkAction("acct_42");
    expect(spy).toHaveBeenCalledWith("acct_42");
  });
});

describe("payout actions", () => {
  it("requestPayoutAction forwards the amount + prop account id", async () => {
    const spy = vi.spyOn(hsc.payouts, "request").mockResolvedValue(PAYOUT);
    await requestPayoutAction(10_000, "prop-1");
    expect(spy).toHaveBeenCalledWith({ amount_cents: 10_000, prop_account_id: "prop-1" });
  });

  it("listPayoutsAction returns the history", async () => {
    vi.spyOn(hsc.payouts, "list").mockResolvedValue([PAYOUT]);
    const r = await listPayoutsAction();
    expect(r).toMatchObject({ ok: true });
    expect((r as { ok: true; data: unknown[] }).data).toHaveLength(1);
  });

  it("getPayoutEstimateAction forwards the prop account id", async () => {
    const spy = vi.spyOn(hsc.payouts, "estimate").mockResolvedValue({
      amount_usd: 100,
      amount_cents: 10_000,
      currency: "usd",
      available: true,
    });
    await getPayoutEstimateAction("prop-7");
    expect(spy).toHaveBeenCalledWith("prop-7");
  });

  it("maps payout errors to the failure envelope", async () => {
    vi.spyOn(hsc.payouts, "request").mockRejectedValue(
      new hsc.HscApiError(402, "V2_PAYOUTS_NOT_CONFIGURED", "no"),
    );
    const r = await requestPayoutAction(5_000);
    expect(r).toMatchObject({ ok: false, code: "V2_PAYOUTS_NOT_CONFIGURED" });
  });
});
