import { Application } from "pixi.js";

export interface PixiHostOptions {
  background: number;
  resolutionCap?: number;
}

export class PixiGameHost {
  app: Application | null = null;
  private cancelled = false;

  async mount(container: HTMLElement, options: PixiHostOptions): Promise<Application | null> {
    const app = new Application();
    const resolution = Math.min(window.devicePixelRatio || 1, options.resolutionCap ?? 2);

    await app.init({
      background: options.background,
      antialias: true,
      autoDensity: true,
      resolution,
      resizeTo: container,
    });

    if (this.cancelled) {
      app.destroy(true);
      return null;
    }

    container.replaceChildren(app.canvas);
    this.app = app;
    return app;
  }

  destroy(): void {
    this.cancelled = true;
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
}
