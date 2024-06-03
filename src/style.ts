import {
  type Declarations,
  type Rule,
  type SimpleSelector,
  type Specificity,
  compareSpecificity,
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

const match = (element: Element, selector: SimpleSelector): boolean =>
  (selector.tagName === "*" ||
    selector.tagName === element.tagName ||
    (!selector.tagName && (!!selector.id || !!selector.classNames))) &&
  (!selector.id || selector.id === element.attributes?.id) &&
  (!selector.classNames ||
    selector.classNames.every(
      (className) =>
        element.attributes && hasClassName(element.attributes, className),
    ));
