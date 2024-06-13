import InputStream from "./input";

type Attributes = Partial<Record<string, string>>;

export type Node = Element | Text;

// const example: MyElement = {
//   tagName: "div",
//   attributes: { class: "foo" },
//   children: [{ tagName: "span" }],
// };
export interface Element {
  tagName: string;
  attributes?: Attributes;
  parent?: Element;
  children?: Node[];
}

export const isElement = (x): x is Element => Object.hasOwn(x, "tagName");

type Text = string;

const isText = (x: unknown): x is Text => typeof x === "string";

const isAlpha = (char: string) => /[a-z]/.test(char);

const parse = (input: string): Node => {
  const inputStream = new InputStream(input);
  return parseNode(inputStream);
};

export default parse;

const parseNode = (inputStream: InputStream, parent?: Element): Node => {
  const char = inputStream.peek();
  if (char === "<") return parseElement(inputStream, parent);
  return parseText(inputStream);
};

const parseElement = (inputStream: InputStream, parent?: Element): Element => {
  // opening tag
  inputStream.consume("<");
  inputStream.readWhitespaces();
  const tagName = inputStream.readWhile(isAlpha);
  const attributes = parseAttributes(inputStream);
  const element: Element = { tagName, parent };
  if (Object.keys(attributes).length) element.attributes = attributes;
  if (inputStream.startsWith("/>")) {
    inputStream.consume("/>");
    return element;
  }
  inputStream.consume(">");

  // children
  const children: Node[] = [];
  while (!inputStream.eof() && !inputStream.startsWith("</"))
    children.push(parseNode(inputStream, element));
  if (children.length) element.children = children;

  // closing tag
  inputStream.consume("</");
  inputStream.readWhitespaces();
  inputStream.consume(tagName);
  inputStream.readWhitespaces();
  inputStream.consume(">");

  return element;
};

const parseAttributes = (inputStream: InputStream) => {
  const attributes: Attributes = {};
  while (!inputStream.eof(true) && ![">", "/"].includes(inputStream.peek())) {
    const name = inputStream.readWhile(isAlpha);
    inputStream.readWhitespaces();
    inputStream.consume("=");
    inputStream.readWhitespaces();
    inputStream.consume('"');
    const value = inputStream.readWhile((char) => char !== '"');
    inputStream.consume('"');
    attributes[name] = value;
  }
  return attributes;
};

const whitespaceCompressRegExp = /[ \n\r\t]+/g;

const parseText = (inputStream: InputStream): Text => {
  return inputStream
    .readWhile((x) => x !== "<")
    .replace(whitespaceCompressRegExp, " ");
};

export const hasClassName = (attributes: Attributes, className: string) =>
  !!attributes.class
    ?.trim()
    .split(" ")
    .find((x) => x === className);
