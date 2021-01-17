import { Settings } from '../../settings/settings.interface';

export abstract class PaintMode {
  protected readonly predictCanvas: OffscreenCanvasRenderingContext2D;
  protected readonly mainCanvas: OffscreenCanvasRenderingContext2D;
  protected settings: Settings;
  protected lastPointer: Float32Array;

  abstract OnLazyUpdate(lastPointer: Float32Array): void;
  abstract OnMoveBegin(point: Float32Array): void;
  public OnMoveOccur(point: Float32Array): void {
    this.lastPointer = point;
  }
  abstract OnMoveComplete(): void;

  public OnSettingsUpdate(settings: any): void {
    this.settings = settings;
  }

  constructor(predictCanvas: OffscreenCanvasRenderingContext2D, mainCanvas: OffscreenCanvasRenderingContext2D, settings: any) {
    this.predictCanvas = predictCanvas;
    this.mainCanvas = mainCanvas;
    this.settings = settings;
  }
}
