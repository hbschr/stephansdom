import "../happydom";
import { describe, expect, it, jest } from "bun:test";
import { h, measureText, once } from "./utils";

describe("once", () => {
  it("should call the factory only once", () => {
    const spy = jest.fn().mockImplementation(() => ({}));
    const singleton = once(spy);
    expect(spy).not.toHaveBeenCalled();
    singleton();
    expect(spy).toHaveBeenCalled();
    singleton();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should even work with falsy return values", () => {
    const spy = jest.fn().mockImplementation(() => false);
    const singleton = once(spy);
    singleton();
    singleton();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should always return the same value", () => {
    const singleton = once(() => ({}));
    expect(singleton()).toBe(singleton());
  });
});

describe("hyperscript", () => {
  it("should create empty element", () => {
    expect(h("div")).toBeInstanceOf(HTMLDivElement);
    expect(h("div").outerHTML).toBe("<div></div>");
    expect(h("a")).toBeInstanceOf(HTMLAnchorElement);
    expect(h("a").outerHTML).toBe("<a></a>");
  });

  it("should create simple attributes", () => {
    expect(h("div", { title: "test" }).outerHTML).toBe(
      '<div title="test"></div>',
    );
    expect(h("a", { href: "uri" }).outerHTML).toBe('<a href="uri"></a>');
  });
});

/**
 * canvas context is not available in test env.
 * test preload applies mock that returns length of string as width.
 */
describe("measureText", () => {
  it("should measure", () => {
    expect(measureText("n")).toBe(1);
    expect(measureText("nn")).toBe(2);
    expect(measureText("nnn")).toBe(3);
  });
});
