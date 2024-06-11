import InputStream from "./input";

/**
 * naming differences from "Selectors Level 4":
 * a "simple selector" is either type, universal, attribute, class or id
 * selector or a pseudo class. this does not exist here.
 * a "compound selector" is a combination of simple selectors. this is described
 * by interface `SimpleSelector` here.
 * a "complex selector" is a chain of one or more compound selectors separated
 * by combinators. this is described by type `Selector` here.
 */

export interface SimpleSelector {
  tagName: string;
  id?: string;
  classNames?: string[];
}

export enum Combinator {
  CHILD = ">",
  DESCENDANT = " ", // " \t\n\r\f"
  NEXT_SIBLING = "+",
  SUBSEQUENT_SIBLING = "~",
}

export type Selector = SimpleSelector | [SimpleSelector, Combinator, Selector];

export type Declarations = Record<string, string>;

// const example: Rule = {
//   selectors: [{ tagName: "div" }],
//   declarations: { display: "block" },
// };
export interface Rule {
  selectors: Selector[];
  declarations: Declarations;
}

export const isSimpleSelector = (x: Selector): x is SimpleSelector =>
  !!x && Object.hasOwn(x, "tagName");

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

const parseSelectors = (inputStream: InputStream): Selector[] => {
  const selectors: Selector[] = [];
  while (inputStream.peek(true) !== "{") {
    selectors.push(maybeChain(inputStream, parseSimpleSelector(inputStream)));
    if (inputStream.peek(true) === ",") inputStream.consume(",");
    else if (inputStream.peek() !== "{") inputStream.croak("unexpected char");
  }
  return selectors;
};

const combinatorMap: Record<string, Combinator> = Object.fromEntries(
  Object.entries(Combinator).map(([k, v]) => [v, Combinator[k]]),
);

const maybeChain = (input: InputStream, selector: Selector): Selector => {
  const whitespaceSpotted = input.peek() === " ";
  if (
    combinatorMap[input.peek(true)] ||
    (whitespaceSpotted && !["{", ","].includes(input.peek(true)))
  ) {
    const comb = combinatorMap[input.peek(true)]
      ? combinatorMap[input.next()]
      : Combinator.DESCENDANT;
    return maybeChain(input, [parseSimpleSelector(input), comb, selector]);
  }
  return selector;
};

const parseSimpleSelector = (inputStream: InputStream): SimpleSelector => {
  inputStream.readWhitespaces();
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

export const specificity = (selector: Selector): Specificity => {
  if (isSimpleSelector(selector))
    return [
      selector.id ? 1 : 0,
      selector.classNames?.length || 0,
      selector.tagName && selector.tagName !== "*" ? 1 : 0,
    ];
  const [subject, _, object] = selector;
  const s1 = specificity(subject);
  const s2 = specificity(object);
  return [s1[0] + s2[0], s1[1] + s2[1], s1[2] + s2[2]];
};

export const compareSpecificity = (a: Specificity, b: Specificity) => {
  const min = Math.min(a.length, b.length);
  for (let i = 0; i < min; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};
