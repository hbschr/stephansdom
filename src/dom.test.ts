import { describe, expect, it } from "bun:test";
import parse, { hasClassName, type Element } from "./dom";

const test = (input: string, expected: Element) => {
  if (!Object.hasOwn(expected, "parent")) expected.parent = undefined;
  expect(parse(input)).toStrictEqual(expected);
};

describe("dom parser", () => {
  it("should parse simple node", () => {
    test("<html></html>", { tagName: "html" });
    test("<div></div>", { tagName: "div" });
    test("<span></span>", { tagName: "span" });
  });

  it("should ignore whitespaces", () => {
    test("< div ></ div >", { tagName: "div" });
  });

  it("should parse attributes", () => {
    test('<div id="id" class="a b c"></div>', {
      tagName: "div",
      attributes: { id: "id", class: "a b c" },
    });
  });

  it("should ignore whitespaces around attributes", () => {
    test('<div id = "id" ></div>', {
      tagName: "div",
      attributes: { id: "id" },
    });
  });

  it("should parse element child", () => {
    // don't know how to check valid parent since it's a circular reference
    test("<div><span></span></div>", {
      tagName: "div",
      children: [{ parent: expect.anything(), tagName: "span" }],
    });
  });

  it("should parse text child", () => {
    test("<div>text</div>", {
      tagName: "div",
      children: ["text"],
    });
  });

  it("should collapse white spaces in text child", () => {
    // actual whitespace handling is more complicated
    // @read https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace
    test("<div> \t a \n b   </div>", {
      tagName: "div",
      children: [" a b "],
    });
  });
});

describe("hasClassName", () => {
  it("should handle positives", () => {
    expect(hasClassName({ class: " a b c " }, "a")).toBe(true);
    expect(hasClassName({ class: " a b c " }, "c")).toBe(true);
  });

  it("should handle negatives", () => {
    expect(hasClassName({ class: " a b c " }, "d")).toBe(false);
  });

  it("should handle empty class", () => {
    expect(hasClassName({ id: "id" }, "a")).toBe(false);
  });
});
