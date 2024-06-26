import { describe, expect, it } from "bun:test";
import parseCss from "./css";
import parseHtml from "./dom";
import { BoxType, type LayoutBox, layout, layoutTree, rect } from "./layout";
import styleTree from "./style";

const parse = (html: string, css: string): LayoutBox =>
  layoutTree(styleTree(parseHtml(html), parseCss(css)));

describe("layout tree", () => {
  it("should create block", () => {
    expect(parse("<div></div>", "div{display:block;}")).toMatchObject({
      type: BoxType.BLOCK,
    });
  });

  it("should create inline", () => {
    expect(parse("<span></span>", "span{display:inline;}")).toMatchObject({
      type: BoxType.INLINE,
    });
  });

  it("should fallback to inline", () => {
    expect(parse("<x></x>", "")).toMatchObject({
      type: BoxType.INLINE,
    });
  });

  it("should pass block children", () => {
    expect(
      parse("<div><p></p><p></p></div>", "div,p{display:block;}"),
    ).toMatchObject({
      type: BoxType.BLOCK,
      children: [{ type: BoxType.BLOCK }, { type: BoxType.BLOCK }],
    });
  });

  it("should pass inline children without adding anonymous boxes", () => {
    expect(
      parse(
        "<div><i></i><i></i></div>",
        "div{display:block;}i{display:inline;}",
      ),
    ).toMatchObject({
      type: BoxType.BLOCK,
      children: [{ type: BoxType.INLINE }, { type: BoxType.INLINE }],
    });
  });

  it("should insert anonymous boxes", () => {
    expect(
      parse(
        "<p><i></i><i></i><p></p><i></i></p>",
        "p{display:block;}i{display:inline;}",
      ),
    ).toMatchObject({
      type: BoxType.BLOCK,
      children: [
        {
          type: BoxType.ANONYMOUS,
          children: [{ type: BoxType.INLINE }, { type: BoxType.INLINE }],
        },
        { type: BoxType.BLOCK },
        {
          type: BoxType.ANONYMOUS,
          children: [{ type: BoxType.INLINE }],
        },
      ],
    });
  });

  it.todo("should handle block boxes inside inline", () => {});
});

describe("block layout", () => {
  const parseBlock = (style = "") =>
    // biome-ignore lint/style/useTemplate: would be overkill here
    parse("<div></div>", "div{display:block;}" + style);

  it("should pass down width and not set undue height", () => {
    expect(layout(parseBlock(), rect({ width: 1 }))).toMatchObject({
      dimensions: { height: 0, width: 1 },
    });
  });

  it("should respect max midth", () => {
    expect(
      layout(parseBlock("div{max-width:2;}"), rect({ width: 3 })),
    ).toMatchObject({ dimensions: { width: 2 } });
  });

  it("should respect min-height", () => {
    expect(layout(parseBlock("div{min-height:1;}"), rect())).toMatchObject({
      dimensions: { height: 1 },
    });
  });

  it("should pass down containg blocks x/y position, and stack on its height", () => {
    expect(layout(parseBlock(), rect({ x: 1, y: 2, height: 3 }))).toMatchObject(
      { dimensions: { x: 1, y: 5 } },
    );
  });

  it("should stack children", () => {
    const tree = parse(
      "<div><p></p><p></p></div>",
      "div,p{display:block;}p{min-height:1;}",
    );
    expect(layout(tree, rect())).toMatchObject({
      dimensions: { height: 2 },
      children: [
        { dimensions: { y: 0, height: 1 } },
        { dimensions: { y: 1, height: 1 } },
      ],
    });
  });
});

describe("inline layout", () => {
  const parseSpan = (html) => parse(html, "span{display:inline;}");
  const parseText = (text) => parse(text, "");

  it("should apply dimensions to text node", () => {
    // mock implementation of measureText returns string length
    expect(layout(parseText("n"), rect({ width: 5 }))).toMatchObject({
      dimensions: { x: 0, y: 0, height: 10, width: 1 },
    });
    expect(layout(parseText("nn"), rect({ width: 5 }))).toMatchObject({
      dimensions: { width: 2 },
    });
  });

  it("should apply dimensions to inline parent", () => {
    expect(
      layout(parseSpan("<span>n</span>"), rect({ width: 5 })),
    ).toMatchObject({
      dimensions: { x: 0, y: 0, width: 1, height: 10 },
      children: [{ dimensions: { x: 0, y: 0, width: 1, height: 10 } }],
    });
  });

  it("should apply height but not width to block parent", () => {
    expect(
      layout(parse("<div>n</div>", "div{display:block;}"), rect({ width: 5 })),
    ).toMatchObject({
      dimensions: { x: 0, y: 0, width: 5, height: 10 },
      children: [{ dimensions: { x: 0, y: 0, width: 1, height: 10 } }],
    });
  });

  it("should apply dimensions to nested inline elements", () => {
    expect(
      layout(
        parseSpan("<span><span>n</span>nn<span>n</span></span>"),
        rect({ width: 5 }),
      ),
    ).toMatchObject({
      dimensions: { width: 4, height: 10 },
      children: [
        {
          dimensions: { x: 0, y: 0, width: 1, height: 10 },
          children: [{ dimensions: { x: 0, y: 0, width: 1, height: 10 } }],
        },
        { dimensions: { x: 1, y: 0, width: 2, height: 10 } },
        {
          dimensions: { x: 3, y: 0, width: 1, height: 10 },
          children: [{ dimensions: { x: 3, y: 0, width: 1, height: 10 } }],
        },
      ],
    });
  });

  it("should overflow on line end", () => {
    expect(
      layout(
        parse(
          "<span><span>n</span>n<span>n</span></span>",
          "span{display:inline;}",
        ),
        rect({ width: 2 }),
      ),
    ).toMatchObject({
      dimensions: { width: 2, height: 20 },
      children: [
        {
          dimensions: { x: 0, y: 0, width: 1, height: 10 },
          children: [{ dimensions: { x: 0, y: 0, width: 1, height: 10 } }],
        },
        { dimensions: { x: 1, y: 0, width: 1, height: 10 } },
        {
          dimensions: { x: 0, y: 10, width: 1, height: 10 },
          children: [{ dimensions: { x: 0, y: 10, width: 1, height: 10 } }],
        },
      ],
    });
  });
});
