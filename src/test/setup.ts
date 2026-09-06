import '@testing-library/jest-dom';

// jsdom in this environment does not ship a usable localStorage, so install a
// small in-memory polyfill that implements the full Storage interface.
class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  writable: true,
});

// jsdom does not implement ResizeObserver, which Radix UI primitives rely on.
class ResizeObserverStub {
  observe(): void {
    // no-op: tests do not exercise resize behaviour
  }
  unobserve(): void {
    // no-op
  }
  disconnect(): void {
    // no-op
  }
}

globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
