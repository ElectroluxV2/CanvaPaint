import { PaintSettings } from '../../paint';

export abstract class PaintMode {
  protected readonly predictCanvas: CanvasRenderingContext2D;
  protected readonly mainCanvas: CanvasRenderingContext2D;
  protected settings: PaintSettings;

  abstract OnLazyUpdate(lastPointer: Float32Array): void;
  abstract OnMoveBegin(point: Float32Array): void;
  abstract OnMoveOccur(point: Float32Array): void;
  abstract OnMoveComplete(): void;

  public OnSettingsUpdate(settings: PaintSettings): void {
    this.settings = settings;
  }

  constructor(predictCanvas: CanvasRenderingContext2D, mainCanvas: CanvasRenderingContext2D, settings: PaintSettings) {
    this.predictCanvas = predictCanvas;
    this.mainCanvas = mainCanvas;
    this.settings = settings;
  }
}
