import { Settings } from '../../settings/settings.interface';
import { FreeLine } from './free-line-mode';
import {StraightLine} from './straight-line-mode';

export abstract class PaintMode {
  protected readonly predictCanvas: CanvasRenderingContext2D;
  protected readonly mainCanvas: CanvasRenderingContext2D;
  protected settings: Settings;
  protected lastPointer: Uint32Array;

  abstract OnLazyUpdate(lastPointer: Uint32Array): void;
  abstract OnMoveBegin(point: Uint32Array, button: number): void;
  public OnMoveOccur(point: Uint32Array, button: number): void {
    this.lastPointer = point;
  }
  abstract OnMoveComplete(pointerHasMoved: boolean, button: number): FreeLine | StraightLine;
  public OnSettingsUpdate(settings: Settings): void {
    this.settings = settings;
  }

  constructor(predictCanvas: CanvasRenderingContext2D, mainCanvas: CanvasRenderingContext2D, settings: Settings) {
    this.predictCanvas = predictCanvas;
    this.mainCanvas = mainCanvas;
    this.settings = settings;
  }
}
