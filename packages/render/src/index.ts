export interface RenderContext {
  canvas: HTMLCanvasElement;
}

export function createRenderer(ctx: RenderContext): { destroy: () => void } {
  void ctx;
  return {
    destroy() {},
  };
}
