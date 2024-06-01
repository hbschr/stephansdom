/**
 * higher order function calling the original only once. subsequent calls
 * always return the initially returned value. used to create singletons.
 */
export function once<T>(fn: () => T): () => T {
  let called = false;
  let result: T;
  // biome-ignore lint/style/noCommaOperator: this one time?
  // biome-ignore lint/suspicious/noAssignInExpressions: please?
  return () => (called ? result : ((called = true), (result = fn())));
}

/**
 * hyperscript method delegating to native DOM API.
 */
export function h<T extends keyof HTMLElementTagNameMap>(
  tag: T,
  props?: Partial<Omit<HTMLElementTagNameMap[T], "style">>,
): HTMLElementTagNameMap[T] {
  return Object.assign(document.createElement(tag), props);
}

const canvasContext = once(
  () => h("canvas").getContext("2d") as CanvasRenderingContext2D,
);

/**
 * measures text with the [canvas API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)
 * [avoiding expensive reflows](https://gist.github.com/Yukiniro/876826e1450b1f8cf755d2cea83cda65).
 */
export function measureText(text: string) {
  return canvasContext().measureText(text).width;
}
