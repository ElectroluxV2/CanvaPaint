import { PaintMode } from './paint-mode';
import { Settings } from '../../settings/settings.interface';

export class StraightLine {
  color: string;
  width: number;
  start: Float32Array;
  stop: Float32Array;

  constructor(color: string, width: number, start: Float32Array, stop: Float32Array) {
    this.color = color;
    this.width = width;
    this.start = start;
    this.stop = stop;
  }
}

export class StraightLineMode extends PaintMode {

  private freeLineOccurringNow = false;

  public static Reproduce(canvas: CanvasRenderingContext2D, compiled: StraightLine): void {

  }

  public OnMoveBegin(point: Float32Array): void {
    console.log('start');
  }

  public OnLazyUpdate(lastPointer: Float32Array): StraightLine {

   return null;
  }

  public OnMoveComplete(): StraightLine {
    return null;
  }

  public OnSettingsUpdate(settings: Settings): void {
    super.OnSettingsUpdate(settings);


  }
}
