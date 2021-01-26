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

  private straightLineOccurringNow = false;
  private currentStraightLine: StraightLine;

  public static Reproduce(canvas: CanvasRenderingContext2D, compiled: StraightLine): void {
    canvas.beginPath();
    canvas.moveTo(compiled.start[0], compiled.start[1]);
    canvas.lineCap = 'round';
    canvas.strokeStyle = compiled.color;
    canvas.lineWidth = compiled.width;
    canvas.lineTo(compiled.stop[0], compiled.stop[1]);
    canvas.stroke();
  }

  public OnMoveBegin(point: Float32Array): void {
    this.straightLineOccurringNow = true;
    this.currentStraightLine = new StraightLine(this.settings.color, this.settings.width, point, new Float32Array(2));
  }

  public OnLazyUpdate(lastPointer: Float32Array): void {
    this.currentStraightLine.stop = lastPointer;
    this.predictCanvas.clear();
    StraightLineMode.Reproduce(this.predictCanvas, this.currentStraightLine);
  }

  public OnMoveComplete(): StraightLine {
    this.straightLineOccurringNow = false;
    this.predictCanvas.clear();
    StraightLineMode.Reproduce(this.mainCanvas, this.currentStraightLine);

    return this.currentStraightLine;
  }

  public OnSettingsUpdate(settings: Settings): void {
    super.OnSettingsUpdate(settings);
  }
}
