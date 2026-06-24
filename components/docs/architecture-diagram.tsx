"use client";

import { motion, useReducedMotion } from "framer-motion";

type Node = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle?: string;
  tone: "you" | "platform" | "external";
};

const NODES: Node[] = [
  { id: "user", x: 24, y: 150, w: 150, h: 70, title: "Your traders", subtitle: "Web / mobile", tone: "you" },
  { id: "app", x: 230, y: 150, w: 160, h: 70, title: "Your app", subtitle: "Vanta starter UI", tone: "you" },
  { id: "api", x: 450, y: 140, w: 180, h: 92, title: "Hyperscaled API", subtitle: "OAuth · multi-tenant", tone: "platform" },
  { id: "stripe", x: 690, y: 40, w: 150, h: 56, title: "Stripe", subtitle: "Payments · Connect", tone: "external" },
  { id: "sumsub", x: 690, y: 152, w: 150, h: 56, title: "Sumsub", subtitle: "KYC / identity", tone: "external" },
  { id: "validator", x: 690, y: 264, w: 150, h: 56, title: "Trading network", subtitle: "Validator · fills", tone: "external" },
];

const EDGES: [string, string][] = [
  ["user", "app"],
  ["app", "api"],
  ["api", "stripe"],
  ["api", "sumsub"],
  ["api", "validator"],
];

const TONE: Record<Node["tone"], { fill: string; stroke: string; text: string; sub: string }> = {
  you: { fill: "hsl(240 7% 11%)", stroke: "hsl(240 5% 24%)", text: "hsl(0 0% 98%)", sub: "hsl(240 5% 64%)" },
  platform: { fill: "hsl(158 84% 45% / 0.12)", stroke: "hsl(158 84% 45% / 0.5)", text: "hsl(0 0% 100%)", sub: "hsl(158 60% 70%)" },
  external: { fill: "hsl(240 7% 10%)", stroke: "hsl(255 30% 92% / 0.12)", text: "hsl(0 0% 92%)", sub: "hsl(240 5% 60%)" },
};

function center(n: Node) {
  return { cx: n.x + n.w / 2, cy: n.y + n.h / 2 };
}

function edgePath(a: Node, b: Node) {
  const from = { x: a.x + a.w, y: center(a).cy };
  const to = { x: b.x, y: center(b).cy };
  const mx = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.x} ${to.y}`;
}

const byId = (id: string) => NODES.find((n) => n.id === id)!;

export function ArchitectureDiagram() {
  const reduce = useReducedMotion();
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card/40 p-4">
      <svg viewBox="0 0 860 360" className="h-auto w-full min-w-[680px]" role="img" aria-label="Integration architecture">
        <defs>
          <linearGradient id="edge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(158 84% 45% / 0.1)" />
            <stop offset="100%" stopColor="hsl(158 84% 55% / 0.9)" />
          </linearGradient>
        </defs>

        {EDGES.map(([a, b], i) => {
          const d = edgePath(byId(a), byId(b));
          return (
            <g key={`${a}-${b}`}>
              <path d={d} fill="none" stroke="hsl(255 30% 92% / 0.1)" strokeWidth={1.5} />
              <motion.path
                d={d}
                fill="none"
                stroke="url(#edge-grad)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="6 10"
                initial={{ strokeDashoffset: 0 }}
                animate={reduce ? undefined : { strokeDashoffset: -64 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "linear", delay: i * 0.15 }}
              />
            </g>
          );
        })}

        {NODES.map((n, i) => {
          const t = TONE[n.tone];
          return (
            <motion.g
              key={n.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={14} fill={t.fill} stroke={t.stroke} strokeWidth={1.5} />
              <text x={n.x + n.w / 2} y={n.y + n.h / 2 - (n.subtitle ? 6 : 0)} textAnchor="middle" fill={t.text} fontSize={15} fontWeight={600} fontFamily="var(--font-geist-sans), system-ui">
                {n.title}
              </text>
              {n.subtitle && (
                <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 14} textAnchor="middle" fill={t.sub} fontSize={11.5} fontFamily="var(--font-geist-sans), system-ui">
                  {n.subtitle}
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
