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

const parseNode = (inputStream: InputStream): Node => {
  const char = inputStream.peek();
  if (char === "<") return parseElement(inputStream);
  return parseText(inputStream);
};

const parseAttributes = (inputStream: InputStream) => {
  const attributes: Attributes = {};
  while (!inputStream.eof(true) && inputStream.peek() !== ">") {
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

const parseElement = (inputStream: InputStream): Element => {
  // opening tag
  inputStream.consume("<");
  inputStream.readWhitespaces();
  const tagName = inputStream.readWhile(isAlpha);
  const attributes = parseAttributes(inputStream);
  inputStream.consume(">");

  const children: Node[] = [];
  while (!inputStream.eof() && !inputStream.startsWith("</"))
    children.push(parseNode(inputStream));

  inputStream.consume("</");
  inputStream.readWhitespaces();
  inputStream.consume(tagName);
  inputStream.readWhitespaces();
  inputStream.consume(">");

  const element: Element = { tagName };
  if (Object.keys(attributes).length) element.attributes = attributes;
  if (children.length) element.children = children;
  return element;
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
