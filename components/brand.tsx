import { cn } from "@/lib/utils";

const MARK_PATH =
  "M35.0907 11.9198L25.6987 22.127L16.1859 11.9578L22.4156 15.1551L23.9335 15.9354L25.1985 14.7269L25.6498 14.2955L26.0005 14.6571L27.2798 15.9735L28.8639 15.1519L35.0907 11.9229M47.694 2.23269L27.7657 12.5637L25.7131 10.4575L23.5052 12.5637L3.3728 2.23269L25.7131 26.1173L47.694 2.23269Z";

const WORDMARK_PATHS = [
  "M55.4182 6.82292H59.9864L63.8469 16.2429L67.7075 6.82292H71.8964L66.2895 20.05H61.2742L55.4182 6.82292Z",
  "M73.5748 17.756L72.6351 20.05H68.6925L74.2682 6.82292H79.4647L85.2216 20.05H81.0157L80.0591 17.756H73.5748ZM74.7805 14.8397H78.8534L76.7929 9.89785L74.7805 14.8397Z",
  "M89.5888 20.05H85.7452V6.82292H89.77L96.6646 14.7512V6.82292H100.491V20.05H96.6816L89.5888 11.9783V20.05Z",
  "M101.188 10.1663V6.82292H115.834V10.1663H110.474V20.05H106.548V10.1663H101.188Z",
  "M129.774 20.0713H125.206L121.345 10.6513L117.485 20.0713H113.296L118.903 6.84427H123.918L129.774 20.0713Z",
];

const GRAD_ID = "vanta-mark-grad";

/**
 * The real Vanta logo. The diamond mark is filled with the brand emerald
 * gradient; the wordmark uses currentColor so it inherits text color.
 *
 * - `showWordmark={false}` renders the mark only (collapsed sidebar).
 * - `brand="hyperscaled"` renders the Hyperscaled lockup (used in docs/API
 *   surfaces to signal the underlying platform).
 */
export function Brand({
  className,
  showWordmark = true,
  brand = "vanta",
}: {
  className?: string;
  showWordmark?: boolean;
  brand?: "vanta" | "hyperscaled";
}) {
  if (brand === "hyperscaled") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/hyperscaled-wordmark.svg"
        alt="Hyperscaled"
        className={cn("h-6 w-auto", className)}
      />
    );
  }

  const gradient = (
    <defs>
      <linearGradient id={GRAD_ID} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(158 84% 52%)" />
        <stop offset="100%" stopColor="hsl(168 84% 38%)" />
      </linearGradient>
    </defs>
  );

  if (!showWordmark) {
    return (
      <svg
        viewBox="2 1 47 25"
        className={cn("h-7 w-auto", className)}
        role="img"
        aria-label="Vanta"
      >
        {gradient}
        <path d={MARK_PATH} fill={`url(#${GRAD_ID})`} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 132 27"
      className={cn("h-6 w-auto", className)}
      role="img"
      aria-label="Vanta"
    >
      {gradient}
      <path d={MARK_PATH} fill={`url(#${GRAD_ID})`} />
      {WORDMARK_PATHS.map((d) => (
        <path key={d} d={d} fill="currentColor" />
      ))}
    </svg>
  );
}
