import { isElement } from "./dom";
import type { StyledNode } from "./style";
import { measureText } from "./utils";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const rect = (r?: Partial<Rect>): Rect => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  ...(r || {}),
});

export enum BoxType {
  BLOCK = "block",
  INLINE = "inline",
  ANONYMOUS = "anon",
}

interface Dimensions {
  dimensions: Rect; // position of content box relative to document origin
}

interface Anon extends Dimensions {
  type: BoxType.ANONYMOUS;
  children: Inline[];
}

interface Block extends Dimensions, Pick<StyledNode, "declarations" | "node"> {
  type: BoxType.BLOCK;
  children?: (Anon | Block)[] | Inline[];
}

interface Inline extends Dimensions, Pick<StyledNode, "declarations" | "node"> {
  type: BoxType.INLINE;
  children?: (Anon | Block)[] | Inline[]; // @todo handle block inside inline
}

export type LayoutBox = Anon | Block | Inline;

const isInlines = (boxes: (Anon | Block)[] | Inline[]): boxes is Inline[] =>
  Boolean(boxes.length) && boxes[0].type === BoxType.INLINE;

const createAnonBox = (children: Inline[]): Anon => ({
  type: BoxType.ANONYMOUS,
  dimensions: rect(),
  children: [...children],
});

export const layoutTree = (node: StyledNode): Block | Inline => {
  const display = node.declarations?.display;
  const box: Block | Inline = {
    type: display === "block" ? BoxType.BLOCK : BoxType.INLINE,
    dimensions: rect(),
    declarations: node.declarations,
    node: node.node,
  };
  if (node.children) box.children = layoutChildren(node.children);
  return box;
};

const layoutChildren = (nodes: StyledNode[]): (Anon | Block)[] | Inline[] => {
  const blocks: (Anon | Block)[] = [];
  const inlines: Inline[] = [];

  for (const node of nodes) {
    const box = layoutTree(node);
    if (box.type === BoxType.INLINE) inlines.push(box);
    else {
      if (inlines.length) {
        blocks.push(createAnonBox(inlines));
        inlines.length = 0;
      }
      blocks.push(box);
    }
  }

  if (!blocks.length) return inlines;
  if (inlines.length) blocks.push(createAnonBox(inlines));
  return blocks;
};

export const layout = (box: LayoutBox, containingBlock: Rect) => {
  if (box.type === BoxType.ANONYMOUS || box.type === BoxType.BLOCK) {
    layoutBlock(box, containingBlock);
  }

  if (box.type === BoxType.INLINE) {
    layoutInline(box, containingBlock);
  }

  return box;
};

const layoutBlock = (
  { dimensions, declarations, children }: Anon | Block,
  containingBlock: Rect,
) => {
  // block width depends on parent, height on children.
  // calculate width traversing down and height on the way back up.

  dimensions.x = containingBlock.x;
  dimensions.width = containingBlock.width;

  if (declarations?.["max-width"]) {
    const maxWidth = Number(declarations["max-width"]);
    if (dimensions.width > maxWidth) dimensions.width = maxWidth;
  }

  // vertical stack on previous siblings
  dimensions.y = containingBlock.y + containingBlock.height;

  if (children?.length)
    if (!isInlines(children))
      for (const child of children) {
        layoutBlock(child, dimensions);
        // update height for following siblings
        dimensions.height += child.dimensions.height;
      }
    else dimensions.height = layoutInlines(children, dimensions).height;

  if (declarations?.["min-height"]) {
    const minHeight = Number(declarations["min-height"]);
    if (dimensions.height < minHeight) dimensions.height = minHeight;
  }
};

const RE_WHITESPACE = /^[ \n\r\t]$/;
const isWhitespace = RE_WHITESPACE.test.bind(RE_WHITESPACE);

const layoutInline = (
  { dimensions, node, children }: Inline,
  containingBlock: Rect,
) => {
  dimensions.x = containingBlock.x;
  dimensions.y = containingBlock.y;
  if (!isElement(node)) {
    // skip whitespaces
    dimensions.width = measureText(node);
    if (!isWhitespace(node)) dimensions.height = 10; // default font size
  } else if (children) {
    const dim = layoutInlines(children as Inline[], containingBlock);
    dimensions.width = dim.width;
    dimensions.height = dim.height;
  }
};

const layoutInlines = (children: Inline[], containingBlock: Rect): Rect => {
  let offsetX = 0;
  let offsetY = 0;
  let width = 0;
  let lineHeight = 0;

  for (const child of children) {
    layoutInline(child, {
      x: containingBlock.x + offsetX,
      y: containingBlock.y + offsetY,
      width: containingBlock.width - offsetX,
      height: 0,
    });

    if (offsetX + child.dimensions.width <= containingBlock.width) {
      lineHeight = Math.max(lineHeight, child.dimensions.height);
      offsetX += child.dimensions.width;
    } else {
      width = Math.max(width, offsetX);
      offsetX = 0;
      offsetY += lineHeight;
      lineHeight = 0;
      layoutInline(child, {
        x: containingBlock.x,
        y: containingBlock.y + offsetY,
        width: containingBlock.width,
        height: 0,
      });
      lineHeight = Math.max(lineHeight, child.dimensions.height);
      offsetX += child.dimensions.width;
    }
  }

  return {
    ...containingBlock,
    width: Math.max(width, offsetX),
    height: lineHeight + offsetY,
  };
};
