import { describe, expect, it } from "bun:test";
import parseCss from "./css";
import parseHtml from "./dom";
import styleTree, { type StyledNode } from "./style";

const parse = (html: string, css: string): StyledNode =>
  styleTree(parseHtml(html), parseCss(css));

describe("style tree", () => {
  it("should not match empty selector", () => {
    expect(parse("<div></div>", "{display:block;}")).toStrictEqual({
      node: { parent: undefined, tagName: "div" },
      declarations: {},
    });
  });

  it("should match tagName", () => {
    expect(parse("<div></div>", "div{display:block;}")).toStrictEqual({
      node: { parent: undefined, tagName: "div" },
      declarations: { display: "block" },
    });
  });

  it("should ignore non-matching tagName", () => {
    expect(parse("<div></div>", "span{display:block;}")).toStrictEqual({
      node: { parent: undefined, tagName: "div" },
      declarations: {},
    });
  });

  it("should match id", () => {
    expect(parse('<div id="foo"></div>', "#foo{display:block;}")).toStrictEqual(
      {
        node: { parent: undefined, tagName: "div", attributes: { id: "foo" } },
        declarations: { display: "block" },
      },
    );
  });

  it("should ignore non-matching id", () => {
    expect(parse('<div id="foo"></div>', "#bar{display:block;}")).toStrictEqual(
      {
        node: { parent: undefined, tagName: "div", attributes: { id: "foo" } },
        declarations: {},
      },
    );
  });

  it("should match class", () => {
    expect(
      parse('<div class="foo"></div>', ".foo{display:block;}"),
    ).toStrictEqual({
      node: { parent: undefined, tagName: "div", attributes: { class: "foo" } },
      declarations: { display: "block" },
    });
  });

  it("should ignore non-matching class", () => {
    expect(
      parse('<div class="foo"></div>', ".bar{display:block;}"),
    ).toStrictEqual({
      node: { parent: undefined, tagName: "div", attributes: { class: "foo" } },
      declarations: {},
    });
  });

  it("should match all", () => {
    expect(
      parse(
        '<div id="foo" class="bar baz"></div>',
        "div#foo.bar.baz{display:block;}",
      ),
    ).toMatchObject({
      declarations: { display: "block" },
    });
  });

  it("should overwrite earlier values", () => {
    expect(
      parse("<div></div>", "div{display:span;display:block;}"),
    ).toMatchObject({
      declarations: { display: "block" },
    });

    expect(
      parse("<div></div>", "div{display:span;}div{display:block;}"),
    ).toMatchObject({
      declarations: { display: "block" },
    });
  });

  it("should respect specificity", () => {
    expect(
      parse(
        '<p id="foo" class="bar"></p>',
        "#foo{color:red;}.bar{color:green;}p{color:blue;}",
      ),
    ).toMatchObject({
      declarations: { color: "red" },
    });

    expect(
      parse('<p id="foo" class="bar"></p>', ".bar{color:green;}p{color:blue;}"),
    ).toMatchObject({
      declarations: { color: "green" },
    });

    expect(
      parse('<p id="foo" class="bar"></p>', "p{color:blue;}"),
    ).toMatchObject({
      declarations: { color: "blue" },
    });
  });
});
