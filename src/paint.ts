import { isElement } from "./dom";
import { BoxType, type LayoutBox } from "./layout";

export const paint = (ctx: CanvasRenderingContext2D, box: LayoutBox) => {
  if (box.type === BoxType.BLOCK) {
    ctx.fillStyle = box.declarations?.["background-color"] || "transparent";
    const d = box.dimensions;
    ctx.fillRect(d.x, d.y, d.width, d.height);
  }
  if (box.type === BoxType.INLINE) {
    if (!isElement(box.node)) {
      const text = box.node;
      const d = box.dimensions;
      ctx.font = "10px sans-serif";
      ctx.strokeText(text, d.x, d.y + 8);
    }
  }
  if (box.children) for (const child of box.children) paint(ctx, child);
};
