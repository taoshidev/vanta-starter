/**
 * Trading server-action tests. The typed client is mocked; we assert each action
 * forwards its arguments (including the optional prop-account id) and wraps the
 * result / error in the standard envelope.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import * as hsc from "@/lib/hsc/client";

import {
  bulkClosePositionsAction,
  cancelOrderAction,
  closePositionAction,
  deskPollAction,
  editOrderAction,
  setTpSlAction,
  submitOrderAction,
} from "./trading";

const OK = { success: true, order_uuid: "o1", message: null, processing_time: 1 };

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("submitOrderAction", () => {
  it("forwards the body + prop account and returns data on success", async () => {
    const spy = vi.spyOn(hsc.trading, "submit").mockResolvedValue(OK);
    const body = { trade_pair: "BTCUSD", order_type: "LONG" as const, leverage: 2 };
    const r = await submitOrderAction(body, "prop-1");
    expect(r).toEqual({ ok: true, data: OK });
    expect(spy).toHaveBeenCalledWith(body, "prop-1");
  });

  it("maps an API error to the standard failure envelope", async () => {
    vi.spyOn(hsc.trading, "submit").mockRejectedValue(
      new hsc.HscApiError(400, "V2_BAD_ORDER", "bad request"),
    );
    const r = await submitOrderAction({ trade_pair: "BTCUSD", order_type: "FLAT" });
    expect(r).toMatchObject({ ok: false, code: "V2_BAD_ORDER", message: "bad request" });
  });
});

describe("other trading actions forward their args", () => {
  it("deskPollAction passes the prop account id", async () => {
    const spy = vi.spyOn(hsc.trading, "deskPoll").mockResolvedValue({
      positions: [],
      orders: [],
      history: [],
      balance: { account_size: 0, status: "active" },
    });
    await deskPollAction("prop-9");
    expect(spy).toHaveBeenCalledWith("prop-9");
  });

  it("closePositionAction forwards the trade pair", async () => {
    const spy = vi.spyOn(hsc.trading, "close").mockResolvedValue(OK);
    await closePositionAction("ETHUSD", "prop-2");
    expect(spy).toHaveBeenCalledWith("ETHUSD", "prop-2");
  });

  it("bulkClosePositionsAction forwards the uuid list", async () => {
    const spy = vi.spyOn(hsc.trading, "bulkClose").mockResolvedValue(OK);
    await bulkClosePositionsAction(["a", "b"], "prop-3");
    expect(spy).toHaveBeenCalledWith(["a", "b"], "prop-3");
  });

  it("cancelOrderAction forwards order + pair", async () => {
    const spy = vi.spyOn(hsc.trading, "cancel").mockResolvedValue(OK);
    await cancelOrderAction("ord-1", "BTCUSD", "prop-4");
    expect(spy).toHaveBeenCalledWith("ord-1", "BTCUSD", "prop-4");
  });

  it("editOrderAction forwards the patch body", async () => {
    const spy = vi.spyOn(hsc.trading, "edit").mockResolvedValue(OK);
    await editOrderAction("ord-1", { limit_price: 100 }, "prop-5");
    expect(spy).toHaveBeenCalledWith("ord-1", { limit_price: 100 }, "prop-5");
  });

  it("setTpSlAction forwards the body", async () => {
    const spy = vi.spyOn(hsc.trading, "tpSl").mockResolvedValue(OK);
    await setTpSlAction({ take_profit: 1 }, "prop-6");
    expect(spy).toHaveBeenCalledWith({ take_profit: 1 }, "prop-6");
  });

  it("maps a non-API error to UNKNOWN", async () => {
    vi.spyOn(hsc.trading, "close").mockRejectedValue(new Error("network"));
    const r = await closePositionAction("BTCUSD");
    expect(r).toMatchObject({ ok: false, code: "UNKNOWN", message: "network" });
  });
});
