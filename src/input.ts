const RE_WHITESPACE = /[ \n\r\t]/;
const isWhitespace = RE_WHITESPACE.test.bind(RE_WHITESPACE);

export default class InputStream {
  private pos = 0;
  private line = 1;
  private col = 0;
  constructor(private input: string) {}

  peek(ignoreWhiteSpaces?: boolean) {
    if (ignoreWhiteSpaces) this.readWhitespaces();
    return this.input.charAt(this.pos);
  }

  eof(ignoreWhiteSpaces?: boolean) {
    return this.peek(ignoreWhiteSpaces) === "";
  }

  next() {
    const char = this.peek();
    this.pos++;
    if (char === "\n") {
      this.line++;
      this.col = 0;
    } else {
      this.col++;
    }
    return char;
  }

  readWhile(predicate: (char: string) => boolean) {
    let str = "";
    while (!this.eof() && predicate(this.peek())) str += this.next();
    return str;
  }

  readWhitespaces() {
    return this.readWhile(isWhitespace) || false;
  }

  startsWith(text: string) {
    return this.input.startsWith(text, this.pos);
  }

  consume(str: string) {
    if (this.startsWith(str)) for (const _ of str) this.next();
    else this.croak(`expected "${str}"`);
  }

  croak(message: string) {
    throw new Error(`(${this.line}:${this.col} "${this.peek()}") ${message}`);
  }
}
