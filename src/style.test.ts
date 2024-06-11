import { describe, expect, it } from "bun:test";
import parseCss from "./css";
import parseHtml from "./dom";
import styleTree, { type StyledNode } from "./style";

const parse = (html: string, css: string): StyledNode =>
  styleTree(parseHtml(html), parseCss(css));

const noDeclarations = expect.not.objectContaining({
  declarations: expect.anything(),
});

const noDisplay = {
  declarations: expect.not.objectContaining({ display: expect.anything() }),
};

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

  it.each([
    [
      "match child",
      "<div><p></p></div>",
      "div>p",
      {
        children: [{ declarations: { display: "block" } }],
      },
    ],
    [
      "not match child",
      "<div><p></p></div>",
      "body>p",
      {
        children: [{ declarations: {} }],
      },
    ],
    [
      "match descendant",
      "<div><ul><li></li></ul></div>",
      "div li",
      {
        children: [{ children: [{ declarations: { display: "block" } }] }],
      },
    ],
    [
      "not match descendant",
      "<ul><li></li></ul>",
      "div li",
      { children: [{ declarations: {} }] },
    ],
    [
      "match next sibling (ignoring text nodes)",
      "<ul><li></li><li></li> <li></li></ul>",
      "li+li",
      {
        children: [
          noDisplay,
          { declarations: { display: "block" } },
          noDeclarations,
          { declarations: { display: "block" } },
        ],
      },
    ],
    [
      "not match next sibling",
      "<ul><li></li><div></div><li></li></ul>",
      "li+li",
      {
        children: [noDisplay, noDisplay, noDisplay],
      },
    ],
    [
      "match subsequent sibling",
      "<ul><li></li><div></div><li></li></ul>",
      "li~li",
      {
        children: [
          noDisplay,
          noDisplay,
          { declarations: { display: "block" } },
        ],
      },
    ],
    [
      "not match subsequent sibling",
      "<ul><div></div><li></li></ul>",
      "li~li",
      {
        children: [noDisplay, noDisplay],
      },
    ],
  ])("should %s combinator", (_, html, selector, expected) => {
    expect(parse(html, `${selector}{display:block;}`)).toMatchObject(expected);
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
