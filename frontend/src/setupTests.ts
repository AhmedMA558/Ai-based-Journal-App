import '@testing-library/jest-dom';

// jsdom doesn't implement ResizeObserver, which recharts' ResponsiveContainer
// (and any future ResizeObserver-dependent library) needs to even mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
