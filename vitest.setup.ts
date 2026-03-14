import '@testing-library/jest-dom/vitest';

// jsdom does not calculate layout, so TanStack Virtual (which relies on offsetWidth/offsetHeight)
// would see 0-sized containers and render no virtual rows. Provide minimal polyfills so tests
// can exercise virtualized rendering logic deterministically.

class ResizeObserverPolyfill {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe(target: Element) {
    // Fire once immediately with a best-effort size.
    const el = target as HTMLElement;
    const width = el.offsetWidth || 800;
    const height = el.offsetHeight || 480;
    this.cb(
      [
        {
          target,
          borderBoxSize: [{ inlineSize: width, blockSize: height }]
        } as unknown as ResizeObserverEntry
      ],
      this as unknown as ResizeObserver
    );
  }
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = globalThis.ResizeObserver ?? ResizeObserverPolyfill;

function readPx(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.match(/^(\d+(?:\.\d+)?)px$/);
  if (!match) return undefined;
  return Number(match[1]);
}

// Patch offsetHeight/offsetWidth so they reflect inline style or sensible defaults.
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    const styleHeight = readPx((this as HTMLElement).style?.height);
    return styleHeight ?? 480;
  }
});

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    const styleWidth = readPx((this as HTMLElement).style?.width);
    return styleWidth ?? 800;
  }
});
