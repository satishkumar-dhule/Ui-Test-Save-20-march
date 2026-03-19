import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  TypedTimeout,
  TypedInterval,
  debounce,
  throttle,
} from "../src/timeout";

describe("TypedTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should create a timeout with delay", () => {
    const callback = vi.fn();
    const timeout = new TypedTimeout(1000, callback);

    timeout.start();

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(999);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should clear timeout before it fires", () => {
    const callback = vi.fn();
    const timeout = new TypedTimeout(1000, callback);

    timeout.start();
    timeout.clear();
    vi.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
  });

  it("should restart timeout", () => {
    const callback = vi.fn();
    const timeout = new TypedTimeout(1000, callback);

    timeout.start();
    vi.advanceTimersByTime(500);
    timeout.restart();
    vi.advanceTimersByTime(500);

    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should track active state", () => {
    const callback = vi.fn();
    const timeout = new TypedTimeout(1000, callback);

    expect(timeout.isActive()).toBe(false);
    timeout.start();
    expect(timeout.isActive()).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(timeout.isActive()).toBe(false);
  });
});

describe("TypedInterval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should create an interval that fires repeatedly", () => {
    const callback = vi.fn();
    const interval = new TypedInterval(500, callback);

    interval.start();
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should clear interval", () => {
    const callback = vi.fn();
    const interval = new TypedInterval(500, callback);

    interval.start();
    vi.advanceTimersByTime(500);
    interval.clear();
    vi.advanceTimersByTime(500);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should track active state", () => {
    const callback = vi.fn();
    const interval = new TypedInterval(500, callback);

    expect(interval.isActive()).toBe(false);
    interval.start();
    expect(interval.isActive()).toBe(true);
    interval.clear();
    expect(interval.isActive()).toBe(false);
  });
});

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should delay function call", () => {
    const callback = vi.fn();
    const [debounced, cancel] = debounce(callback, 300);

    debounced();
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(299);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should reset delay on subsequent calls", () => {
    const callback = vi.fn();
    const [debounced] = debounce(callback, 300);

    debounced();
    vi.advanceTimersByTime(200);
    debounced();
    vi.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should cancel debounced call", () => {
    const callback = vi.fn();
    const [debounced, cancel] = debounce(callback, 300);

    debounced();
    cancel();
    vi.advanceTimersByTime(300);
    expect(callback).not.toHaveBeenCalled();
  });
});

describe("throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should call immediately on first invocation", () => {
    const callback = vi.fn();
    const throttled = throttle(callback, 300);

    throttled();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should ignore subsequent calls within limit", () => {
    const callback = vi.fn();
    const throttled = throttle(callback, 300);

    throttled();
    throttled();
    throttled();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should allow call after limit expires", () => {
    const callback = vi.fn();
    const throttled = throttle(callback, 300);

    throttled();
    vi.advanceTimersByTime(300);
    throttled();
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
