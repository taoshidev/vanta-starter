import "@testing-library/jest-dom/vitest";

// ── Test environment variables ───────────────────────────────────────────────
// Set BEFORE any module under test reads `lib/hsc/config.ts` (evaluated at
// import time). Use ??= so a real shell env can still override.
process.env.HSC_API_BASE_URL ??= "http://test-api";
process.env.HSC_CLIENT_ID ??= "hsc_test";
process.env.HSC_CLIENT_SECRET ??= "hsk_test";
process.env.SESSION_COOKIE_NAME ??= "hsc_test_session";
process.env.SESSION_COOKIE_SECRET ??= "test-secret-32-chars-aaaaaaaaaaaa";
process.env.HSC_WEBHOOK_SECRET ??= "wh_test_secret";
process.env.NEXT_PUBLIC_HSC_API_BASE_URL ??= "http://test-api";

// ── DOM stubs ────────────────────────────────────────────────────────────────
// Radix primitives (Select, Tooltip, etc.) observe element size; happy-dom has
// no ResizeObserver. Provide a no-op so component tests don't crash on mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as never);
