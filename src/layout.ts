import type { StyledNode } from "./style";

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

interface Block extends Dimensions, Pick<StyledNode, "declarations" | "node"> {
  type: BoxType.BLOCK;
  children?: LayoutBox[];
}

interface Inline extends Dimensions, Pick<StyledNode, "declarations" | "node"> {
  type: BoxType.INLINE;
  children?: LayoutBox[];
}

export type LayoutBox = Block | Inline;

export const layoutTree = (node: StyledNode): Block | Inline => {
  const display = node.declarations?.display;
  const box: Block | Inline = {
    type: display === "block" ? BoxType.BLOCK : BoxType.INLINE,
    dimensions: rect(),
    declarations: node.declarations,
    node: node.node,
  };
  if (node.children) box.children = node.children.map(layoutTree);
  return box;
};

export const layout = (box: LayoutBox, containingBlock: Rect) => {
  if (box.type === BoxType.BLOCK) {
    layoutBlock(box, containingBlock);
  }

  // @todo inline and anonymous

  return box;
};

const layoutBlock = (
  { dimensions, declarations, children }: Block,
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
    for (const child of children) {
      layout(child, dimensions);
      // update height for following siblings
      dimensions.height += child.dimensions.height;
    }

  if (declarations?.["min-height"]) {
    const minHeight = Number(declarations["min-height"]);
    if (dimensions.height < minHeight) dimensions.height = minHeight;
  }
};
