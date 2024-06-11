import { describe, expect, it } from "bun:test";
import parse, {
  Combinator,
  compareSpecificity,
  specificity,
  type Specificity,
} from "./css";

describe("css parser", () => {
  it("should parse simple tag selector", () => {
    expect(parse("div{display:block;}")).toStrictEqual([
      {
        selectors: [{ tagName: "div" }],
        declarations: { display: "block" },
      },
    ]);
  });

  it("should parse simple id selector", () => {
    expect(parse("#id{display:block;}")).toStrictEqual([
      {
        selectors: [{ tagName: "", id: "id" }],
        declarations: { display: "block" },
      },
    ]);
  });

  it("should parse simple class selector", () => {
    expect(parse(".cls{display:block;}")).toStrictEqual([
      {
        selectors: [{ tagName: "", classNames: ["cls"] }],
        declarations: { display: "block" },
      },
    ]);
  });

  it("should parse a compound selector", () => {
    expect(parse("div#id.cls{display:block;}")).toStrictEqual([
      {
        selectors: [{ tagName: "div", id: "id", classNames: ["cls"] }],
        declarations: { display: "block" },
      },
    ]);
  });

  it.each([
    [
      "child",
      "div>p{}",
      [{ tagName: "p" }, Combinator.CHILD, { tagName: "div" }],
    ],
    [
      "descendant",
      "div p{}",
      [{ tagName: "p" }, Combinator.DESCENDANT, { tagName: "div" }],
    ],
    [
      "next sibling",
      "div+p{}",
      [{ tagName: "p" }, Combinator.NEXT_SIBLING, { tagName: "div" }],
    ],
    [
      "subsequent sibling",
      "div~p{}",
      [{ tagName: "p" }, Combinator.SUBSEQUENT_SIBLING, { tagName: "div" }],
    ],
    [
      "chained",
      "html > body div + p ~ ul {}",
      [
        { tagName: "ul" },
        Combinator.SUBSEQUENT_SIBLING,
        [
          { tagName: "p" },
          Combinator.NEXT_SIBLING,
          [
            { tagName: "div" },
            Combinator.DESCENDANT,
            [{ tagName: "body" }, Combinator.CHILD, { tagName: "html" }],
          ],
        ],
      ],
    ],
  ])("should parse %s combinator", (_, css, expected) => {
    expect(parse(css)).toMatchObject([{ selectors: [expected] }]);
  });

  it("should parse multiple selectors", () => {
    expect(parse("div,#id,.cls{display:block;}")).toStrictEqual([
      {
        selectors: [
          { tagName: "div" },
          { tagName: "", id: "id" },
          { tagName: "", classNames: ["cls"] },
        ],
        declarations: { display: "block" },
      },
    ]);
  });

  it("should parse multiple rules", () => {
    expect(parse("div{display:block;}span{display:inline;}")).toStrictEqual([
      {
        selectors: [{ tagName: "div" }],
        declarations: { display: "block" },
      },
      {
        selectors: [{ tagName: "span" }],
        declarations: { display: "inline" },
      },
    ]);
  });

  it("should ignore whitespaces", () => {
    expect(
      parse(" div , p { display : block ; } span { display : inline ; } "),
    ).toStrictEqual([
      {
        selectors: [{ tagName: "div" }, { tagName: "p" }],
        declarations: { display: "block" },
      },
      {
        selectors: [{ tagName: "span" }],
        declarations: { display: "inline" },
      },
    ]);
  });

  it("should handle empty selector", () => {
    expect(parse("{display:block;}")).toStrictEqual([
      {
        selectors: [],
        declarations: { display: "block" },
      },
    ]);
  });

  it("should misbehave", () => {
    expect(parse(",{display:block;}")).toStrictEqual([
      {
        selectors: [{ tagName: "" }],
        declarations: { display: "block" },
      },
    ]);
  });

  it("should handle empty declarations", () => {
    expect(parse("div{ }")).toStrictEqual([
      {
        selectors: [{ tagName: "div" }],
        declarations: {},
      },
    ]);
  });
});

describe("specificity", () => {
  it("should count id", () => {
    expect(specificity({ tagName: "", id: "" })).toStrictEqual([0, 0, 0]);
    expect(specificity({ tagName: "", id: "id" })).toStrictEqual([1, 0, 0]);
  });

  it("should count classNames", () => {
    expect(specificity({ tagName: "" })).toStrictEqual([0, 0, 0]);
    expect(specificity({ tagName: "", classNames: [] })).toStrictEqual([
      0, 0, 0,
    ]);
    expect(specificity({ tagName: "", classNames: ["cls"] })).toStrictEqual([
      0, 1, 0,
    ]);
    expect(
      specificity({ tagName: "", classNames: ["c1", "c2"] }),
    ).toStrictEqual([0, 2, 0]);
  });

  it("should count tagName", () => {
    expect(specificity({ tagName: "" })).toStrictEqual([0, 0, 0]);
    expect(specificity({ tagName: "*" })).toStrictEqual([0, 0, 0]);
    expect(specificity({ tagName: "tag" })).toStrictEqual([0, 0, 1]);
  });

  it("should handle compound selector", () => {
    expect(
      specificity({ tagName: "tag", id: "id", classNames: ["c2", "c2"] }),
    ).toStrictEqual([1, 2, 1]);
  });

  it("should sum up complex selector", () => {
    expect(
      specificity(parse("div.ls>ul #pivot+.selected~li{}")[0].selectors[0]),
    ).toStrictEqual([1, 2, 3]);
  });

  it("should sort", () => {
    const specificities: Specificity[] = [
      [1, 0, 0],
      [2, 0, 0],
      [10, 0, 0],
    ];
    expect(specificities.sort(compareSpecificity)).toStrictEqual([
      [1, 0, 0],
      [2, 0, 0],
      [10, 0, 0],
    ]);
  });
});
