"use client";

import { useEffect, useState, useTransition } from "react";
import { Activity, Layers, ListOrdered, X } from "lucide-react";
import { toast } from "sonner";

import {
  bulkClosePositionsAction,
  cancelOrderAction,
  closePositionAction,
  deskPollAction,
  setTpSlAction,
  submitOrderAction,
} from "@/app/actions/trading";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { friendlyError } from "@/lib/errors";
import type { PropAccountSummary } from "@/lib/hsc/client";
import { cn } from "@/lib/utils";

type Snapshot = {
  positions: Array<Record<string, unknown>>;
  orders: Array<Record<string, unknown>>;
  history: Array<Record<string, unknown>>;
  balance: { account_size: number; status: string };
};

// Valid crypto pairs. `id` is the wire `trade_pair_id` the network expects
// (e.g. "BTCUSD"); `label` is the human display ("BTC/USD"). Sending the
// labeled form with a slash makes the validator reject the order with 400.
const TRADE_PAIRS = [
  { id: "BTCUSD", label: "BTC/USD" },
  { id: "ETHUSD", label: "ETH/USD" },
  { id: "SOLUSD", label: "SOL/USD" },
  { id: "XRPUSD", label: "XRP/USD" },
  { id: "DOGEUSD", label: "DOGE/USD" },
  { id: "ADAUSD", label: "ADA/USD" },
  { id: "TAOUSD", label: "TAO/USD" },
];

const PAIR_LABEL = new Map(TRADE_PAIRS.map((tp) => [tp.id, tp.label]));

// The validator returns `trade_pair` as a tuple
// `[wireId, displayLabel, ...fees]` (e.g. ["BTCUSD","BTC/USD",0.001,...]).
// Pull the wire id (index 0) for API calls and a friendly label for display.
function pairId(raw: unknown): string {
  if (Array.isArray(raw)) return String(raw[0] ?? "");
  return String(raw ?? "");
}
function pairLabel(raw: unknown): string {
  if (Array.isArray(raw)) return String(raw[1] ?? raw[0] ?? "");
  const id = String(raw ?? "");
  return PAIR_LABEL.get(id) ?? id;
}

export function TradingTerminal({
  accounts,
  initialId,
}: {
  accounts: PropAccountSummary[];
  initialId: string;
}) {
  const [accountId, setAccountId] = useState(initialId);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [, startTransition] = useTransition();
  const [selectedPositions, setSelected] = useState<Set<string>>(new Set());

  const [pair, setPair] = useState("BTCUSD");
  const [side, setSide] = useState<"LONG" | "SHORT">("LONG");
  const [leverage, setLeverage] = useState("0.1");

  async function refresh() {
    const r = await deskPollAction(accountId);
    if (r.ok && r.data) setSnap(r.data);
    else if (!r.ok) toast.error(friendlyError(r.code, r.message));
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await submitOrderAction(
        { trade_pair: pair, order_type: side, leverage: Number(leverage) },
        accountId
      );
      if (r.ok && r.data?.success) {
        toast.success(`Order submitted${r.data.order_uuid ? ` · ${r.data.order_uuid.slice(0, 8)}` : ""}`);
        refresh();
      } else if (r.ok) {
        toast.error(r.data?.message ?? "Order rejected");
      } else {
        toast.error(friendlyError(r.code, r.message));
      }
    });
  }

  function close(p: string) {
    startTransition(async () => {
      const r = await closePositionAction(p, accountId);
      if (r.ok) toast.success(`Closed ${p}`);
      else toast.error(friendlyError(r.code, r.message));
      refresh();
    });
  }

  function bulkClose() {
    if (selectedPositions.size === 0) return;
    startTransition(async () => {
      const r = await bulkClosePositionsAction([...selectedPositions], accountId);
      if (r.ok) toast.success(`Closed ${selectedPositions.size} positions`);
      else toast.error(friendlyError(r.code, r.message));
      setSelected(new Set());
      refresh();
    });
  }

  function cancel(o: { order_uuid: string; trade_pair: string }) {
    startTransition(async () => {
      const r = await cancelOrderAction(o.order_uuid, o.trade_pair, accountId);
      if (r.ok) toast.success("Order cancelled");
      else toast.error(friendlyError(r.code, r.message));
      refresh();
    });
  }

  function setBracket(p: string, tp: string, sl: string) {
    startTransition(async () => {
      const body: Record<string, unknown> = { trade_pair: p, order_type: "FLAT" };
      if (tp) body.take_profit = Number(tp);
      if (sl) body.stop_loss = Number(sl);
      const r = await setTpSlAction(body, accountId);
      if (r.ok) toast.success("TP/SL attached");
      else toast.error(friendlyError(r.code, r.message));
      refresh();
    });
  }

  const positions = snap?.positions ?? [];
  const orders = snap?.orders ?? [];
  const history = snap?.history ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <Label>Prop account</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="w-[320px] max-w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.tier_id} · ${a.account_size.toLocaleString()} · {a.status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {snap && (
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-muted-foreground">Account size</div>
              <div className="text-lg font-semibold">
                ${Number(snap.balance.account_size).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <StatusBadge status={snap.balance.status} />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Order ticket */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">New order</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={side === "LONG" ? "default" : "outline"}
                  onClick={() => setSide("LONG")}
                  className={cn(side === "LONG" && "bg-success text-success-foreground hover:bg-success/90")}
                >
                  Long
                </Button>
                <Button
                  type="button"
                  variant={side === "SHORT" ? "default" : "outline"}
                  onClick={() => setSide("SHORT")}
                  className={cn(
                    side === "SHORT" && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  )}
                >
                  Short
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label>Pair</Label>
                <Select value={pair} onValueChange={setPair}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADE_PAIRS.map((tp) => (
                      <SelectItem key={tp.id} value={tp.id}>
                        {tp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leverage">Leverage</Label>
                <Input
                  id="leverage"
                  type="number"
                  step="0.01"
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Submit market order
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Positions */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="size-4 text-muted-foreground" /> Positions
                <Badge variant="secondary">{positions.length}</Badge>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedPositions.size === 0}
                onClick={bulkClose}
              >
                Close selected ({selectedPositions.size})
              </Button>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No open positions.</p>
              ) : (
                <div className="space-y-2">
                  {positions.map((p) => {
                    const uuid = String(p["position_uuid"] ?? p["order_uuid"] ?? "");
                    const pid = pairId(p["trade_pair"]);
                    const ppair = pairLabel(p["trade_pair"]);
                    const ptype = String(p["position_type"] ?? "");
                    return (
                      <div
                        key={uuid || ppair}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card/40 p-3"
                      >
                        <label className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            className="size-4 accent-[hsl(var(--primary))]"
                            checked={selectedPositions.has(uuid)}
                            onChange={(e) => {
                              const next = new Set(selectedPositions);
                              if (e.target.checked) next.add(uuid);
                              else next.delete(uuid);
                              setSelected(next);
                            }}
                          />
                          <span className="font-mono text-sm font-medium">{ppair}</span>
                          {ptype && (
                            <Badge variant={ptype.toUpperCase() === "LONG" ? "success" : "destructive"}>
                              {ptype}
                            </Badge>
                          )}
                          {p["net_leverage"] != null && (
                            <span className="text-xs text-muted-foreground">
                              {Math.abs(Number(p["net_leverage"])).toFixed(2)}x
                            </span>
                          )}
                          {p["current_return"] != null &&
                            (() => {
                              const pct = (Number(p["current_return"]) - 1) * 100;
                              return (
                                <span
                                  className={cn(
                                    "font-mono text-xs",
                                    pct > 0
                                      ? "text-success"
                                      : pct < 0
                                        ? "text-destructive"
                                        : "text-muted-foreground"
                                  )}
                                >
                                  {pct > 0 ? "+" : ""}
                                  {pct.toFixed(2)}%
                                </span>
                              );
                            })()}
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="TP"
                            id={`tp-${uuid}`}
                            className="h-8 w-20"
                          />
                          <Input
                            placeholder="SL"
                            id={`sl-${uuid}`}
                            className="h-8 w-20"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const tp = (document.getElementById(`tp-${uuid}`) as HTMLInputElement).value;
                              const sl = (document.getElementById(`sl-${uuid}`) as HTMLInputElement).value;
                              setBracket(pid, tp, sl);
                            }}
                          >
                            TP/SL
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => close(pid)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resting orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListOrdered className="size-4 text-muted-foreground" /> Resting orders
                <Badge variant="secondary">{orders.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No resting orders.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pair</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Limit</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => {
                      const uuid = String(o["order_uuid"] ?? "");
                      const oid = pairId(o["trade_pair"]);
                      const opair = pairLabel(o["trade_pair"]);
                      return (
                        <TableRow key={uuid}>
                          <TableCell className="font-mono">{opair}</TableCell>
                          <TableCell>{String(o["order_type"] ?? "—")}</TableCell>
                          <TableCell>{String(o["limit_price"] ?? "—")}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancel({ order_uuid: uuid, trade_pair: oid })}
                            >
                              <X /> Cancel
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="size-4 text-muted-foreground" /> Recent history
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No closed positions yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {history.slice(0, 10).map((h, i) => {
                    // Closed positions report `realized_pnl` (USD) and
                    // `return_at_close` (multiplier, 1.0 = breakeven).
                    const usd = h["realized_pnl"];
                    const ret = Number(h["return_at_close"] ?? 1);
                    const pnl = usd != null ? Number(usd) : (ret - 1) * 100;
                    const display =
                      usd != null
                        ? `$${Number(usd).toFixed(2)}`
                        : `${((ret - 1) * 100).toFixed(2)}%`;
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0"
                      >
                        <span className="font-mono">{pairLabel(h["trade_pair"])}</span>
                        <span
                          className={cn(
                            "font-mono",
                            pnl > 0 ? "text-success" : pnl < 0 ? "text-destructive" : "text-muted-foreground"
                          )}
                        >
                          {pnl > 0 ? "+" : ""}
                          {display}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
