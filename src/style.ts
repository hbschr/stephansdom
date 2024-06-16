import {
  Combinator,
  type Declarations,
  type Rule,
  type Selector,
  type SimpleSelector,
  type Specificity,
  compareSpecificity,
  isSimpleSelector,
  specificity,
} from "./css";
import { type Element, type Node, hasClassName, isElement } from "./dom";

export interface StyledNode {
  declarations?: Declarations;
  node: Node;
  children?: StyledNode[];
}

const styleTree = (node: Node, rules: Rule[]): StyledNode => {
  const styleNode: StyledNode = { node };
  if (isElement(node)) styleNode.declarations = specifiedValues(node, rules);
  if (isElement(node) && node.children)
    styleNode.children = node.children.map((child) => styleTree(child, rules));
  return styleNode;
};

export default styleTree;

const specifiedValues = (element: Element, rules: Rule[]): Declarations => {
  return matchRules(element, rules).reduce(Object.assign, {});
};

const matchRules = (element: Element, rules: Rule[]): Declarations[] => {
  return rules
    .flatMap<[Specificity, Declarations]>((rule) =>
      rule.selectors
        .filter((selector) => match(element, selector))
        .map((selector) => [specificity(selector), rule.declarations]),
    )
    .sort(([a], [b]) => compareSpecificity(a, b))
    .map(([_, declarations]) => declarations);
};

const match = (element: Element, selector: Selector): boolean => {
  if (isSimpleSelector(selector)) return matchSimple(element, selector);
  const [subject, comb, object] = selector;
  return matchSimple(element, subject) && matchMap[comb](element, object);
};

const elderSiblingsIterator = (e: Element): (() => Node | undefined) => {
  const siblings = e.parent?.children;
  let index = siblings?.findLastIndex((x) => x === e);
  return () => {
    if (index === undefined || index === -1 || !siblings) return;
    if (index >= 0) --index;
    return siblings[index];
  };
};

const matchMap: Record<Combinator, (e: Element, s: Selector) => boolean> = {
  [Combinator.CHILD]: (e, s) => !!e.parent && match(e.parent, s),
  [Combinator.DESCENDANT]: (e, s) => {
    for (let curr = e.parent; curr; curr = curr.parent)
      if (match(curr, s)) return true;
    return false;
  },
  [Combinator.NEXT_SIBLING]: (e, s) => {
    const it = elderSiblingsIterator(e);
    for (let sinbling = it(); sinbling; sinbling = it())
      if (isElement(sinbling)) return match(sinbling, s);
    return false;
  },
  [Combinator.SUBSEQUENT_SIBLING]: (e, s) => {
    const it = elderSiblingsIterator(e);
    for (let sibling = it(); sibling; sibling = it())
      if (isElement(sibling) && match(sibling, s)) return true;
    return false;
  },
};

const matchSimple = (element: Element, selector: SimpleSelector): boolean =>
  (selector.tagName === "*" ||
    selector.tagName === element.tagName ||
    (!selector.tagName && (!!selector.id || !!selector.classNames))) &&
  (!selector.id || selector.id === element.attributes?.id) &&
  (!selector.classNames ||
    selector.classNames.every(
      (className) =>
        element.attributes && hasClassName(element.attributes, className),
    ));
