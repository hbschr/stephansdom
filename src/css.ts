import InputStream from "./input";

export interface SimpleSelector {
  tagName: string;
  id?: string;
  classNames?: string[];
}

export type Declarations = Record<string, string>;

// const example: Rule = {
//   selectors: [{ tagName: "div" }],
//   declarations: { display: "block" },
// };
export interface Rule {
  selectors: SimpleSelector[];
  declarations: Declarations;
}

const isAlpha = (char: string) => /[a-z]/.test(char);
const isAlphaNum = (char: string) => /[a-z0-9]/.test(char);

const parse = (input: string): Rule[] => {
  const inputStream = new InputStream(input);
  const styleSheet: Rule[] = [];
  while (!inputStream.eof(true)) {
    const selectors = parseSelectors(inputStream);
    inputStream.consume("{");
    const declarations = parseDeclarations(inputStream);
    inputStream.consume("}");
    styleSheet.push({ selectors, declarations });
  }
  return styleSheet;
};

export default parse;

const parseSimpleSelector = (inputStream: InputStream): SimpleSelector => {
  const selector: SimpleSelector = { tagName: inputStream.readWhile(isAlpha) };
  while (!inputStream.eof() && "#.".includes(inputStream.peek())) {
    const char = inputStream.next();
    if (char === "#") {
      selector.id = inputStream.readWhile(isAlphaNum);
    } else {
      if (!selector.classNames) selector.classNames = [];
      selector.classNames.push(inputStream.readWhile(isAlphaNum));
    }
  }
  return selector;
};

const parseSelectors = (inputStream: InputStream): SimpleSelector[] => {
  const selectors: SimpleSelector[] = [];
  while (inputStream.peek(true) !== "{") {
    selectors.push(parseSimpleSelector(inputStream));
    if (inputStream.peek(true) === ",") inputStream.consume(",");
    else if (inputStream.peek() !== "{") inputStream.croak("unexpected char");
  }
  return selectors;
};

const parseDeclarations = (inputStream: InputStream): Declarations => {
  const declarations: Declarations = {};
  while (inputStream.peek(true) !== "}") {
    const name = inputStream.readWhile((char) => char !== ":");
    inputStream.consume(":");
    const value = inputStream.readWhile((char) => char !== ";");
    inputStream.consume(";");
    declarations[name.trim()] = value.trim();
  }
  return declarations;
};

export type Specificity = [number, number, number];

export const specificity = (selector: SimpleSelector): Specificity => {
  return [
    selector.id ? 1 : 0,
    selector.classNames?.length || 0,
    selector.tagName && selector.tagName !== "*" ? 1 : 0,
  ];
};

export const compareSpecificity = (a: Specificity, b: Specificity) => {
  const min = Math.min(a.length, b.length);
  for (let i = 0; i < min; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};
