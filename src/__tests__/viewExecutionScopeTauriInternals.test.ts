// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { ref } from "vue";
import { createViewExecutionScope } from "../components/view/viewExecutionScope";

const workspaceRef = { checkoutId: "checkout-a", expectedGeneration: 1 };

function makeScope() {
  return createViewExecutionScope({
    viewId: "view-a",
    editorId: "editor-a",
    workspaceRef,
    active: ref(true),
    state: new Map<string, unknown>(),
    log: () => {},
  });
}

describe("view execution scope tauri internals", () => {
  afterEach(() => {
    delete (globalThis.window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
    delete (globalThis.window as unknown as Record<string, unknown>).__TAURI__;
  });

  it("hides tauri internals from executed view code", () => {
    const fakeInternals = { invoke: () => "leak" };
    (globalThis.window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = fakeInternals;
    (globalThis.window as unknown as Record<string, unknown>).__TAURI__ = { mock: true };

    const scopedWindow = makeScope().globals({}).window as unknown as Record<string, unknown>;

    expect(scopedWindow.__TAURI_INTERNALS__).toBeUndefined();
    expect(scopedWindow.__TAURI__).toBeUndefined();
    expect(window.__TAURI_INTERNALS__).toBe(fakeInternals);
  });

  it("still exposes the sanctioned overrides", () => {
    const globalsRecord = makeScope().globals({});
    const scopedWindow = globalsRecord.window as unknown as Record<string, unknown>;

    expect(typeof scopedWindow.setTimeout).toBe("function");
    expect(typeof scopedWindow.addEventListener).toBe("function");
    expect(scopedWindow.window).toBe(scopedWindow);
    expect(typeof globalsRecord.locus).toBe("object");
  });
});
