import { PaintMode } from './paint-mode';
import { Settings } from '../../settings/settings.interface';

export class StraightLine {
  color: string;
  width: number;
  start: Float32Array;
  stop: Float32Array;

  constructor(color: string, width: number, start?: Float32Array, stop?: Float32Array) {
    this.color = color;
    this.width = width;
    this.start = start ?? new Float32Array(2);
    this.stop = stop ?? new Float32Array(2);
  }

  public Duplicate(): StraightLine {
    return new StraightLine(this.color, this.width, this.start, this.stop);
  }

  public ApplySettings(settings: Settings): void {
    this.width = settings.width;
    this.color = settings.color;
  }
}

export class StraightLineMode extends PaintMode {
  private movingControlPoint = false;
  private controlPointPosition: Float32Array;
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

  private DrawControlDot(): void {
    this.predictCanvas.beginPath();
    this.predictCanvas.arc(
      this.controlPointPosition[0],
      this.controlPointPosition[1],
      this.settings.width * 2.5 / Math.PI,
      0,
      2 * Math.PI,
      false
    );
    this.predictCanvas.fillStyle = 'purple';
    this.predictCanvas.fill();
  }

  public OnMoveBegin(point: Float32Array, button: number): void {

    if (!this.currentStraightLine) {
      this.currentStraightLine = new StraightLine(this.settings.color, this.settings.width, point, new Float32Array(2));
    }

    this.movingControlPoint = button === 2;
    if (!this.controlPointPosition) {
      this.controlPointPosition = Float32Array.from(point);
    }

  }

  public OnLazyUpdate(lastPointer: Float32Array): void {
    this.currentStraightLine.stop = lastPointer;

    this.predictCanvas.clear();

    if (this.movingControlPoint) {
      this.controlPointPosition = lastPointer;
      this.DrawControlDot();
      return;
    }

    StraightLineMode.Reproduce(this.predictCanvas, this.currentStraightLine);
    this.DrawControlDot();
  }

  public OnMoveComplete(pointerHasMoved: boolean, button: number): StraightLine | null {

    this.predictCanvas.clear();
    this.DrawControlDot();

    if (button === 2) {
      this.controlPointPosition = this.lastPointer;
      this.currentStraightLine.start = this.lastPointer;
      this.movingControlPoint = true;

      this.predictCanvas.clear();
      this.DrawControlDot();
      return null;
    }

    StraightLineMode.Reproduce(this.mainCanvas, this.currentStraightLine);

    // Return new insteadof copy
    return this.currentStraightLine.Duplicate();
  }

  public OnSettingsUpdate(settings: Settings): void {
    this.currentStraightLine.ApplySettings(settings);
    super.OnSettingsUpdate(settings);
  }
}
