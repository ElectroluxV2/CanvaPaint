import { PaintMode } from './paint-mode';
import { Settings } from '../../settings/settings.interface';
import { StraightLine } from './straight-line-mode';

export class ContinuousStraightLineMode extends PaintMode {
  private controlPointPosition: Float32Array;
  private movingControlPoint = false;
  private readonly currentStraightLine: StraightLine;

  constructor(predictCanvas: CanvasRenderingContext2D, mainCanvas: CanvasRenderingContext2D, settings: Settings) {
    super(predictCanvas, mainCanvas, settings);

    this.currentStraightLine = new StraightLine(settings.color, settings.width);
  }

  public static Reproduce(canvas: CanvasRenderingContext2D, compiled: StraightLine): void {
    canvas.beginPath();
    canvas.moveTo(compiled.start[0], compiled.start[1]);
    canvas.strokeStyle = compiled.color;
    canvas.lineWidth = compiled.width;
    canvas.lineTo(compiled.stop[0], compiled.stop[1]);
    canvas.stroke();
  }

  public OnMoveBegin(point: Float32Array, button: number): void {
    this.movingControlPoint = button !== 0;

    if (button === 0) {
      if (!!this.controlPointPosition) {
        this.currentStraightLine.start = this.controlPointPosition;
        this.currentStraightLine.stop = point;
      } else {
        this.controlPointPosition = point;
        this.currentStraightLine.start = point;
        this.currentStraightLine.stop = point; // See statement in OnLazyUpdate
      }
    }
  }

  public OnMoveOccur(point: Float32Array, button: number) {
    super.OnMoveOccur(point, button);
    if (this.movingControlPoint) {
      this.controlPointPosition = point;
    } else {
      this.currentStraightLine.stop = point;
    }
  }

  public OnLazyUpdate(lastPointer: Float32Array): void {
    this.predictCanvas.clear();

    if (this.movingControlPoint) {
      this.DrawControlDot();
    } else {
      if (this.currentStraightLine.start[0] === this.currentStraightLine.stop[0]
       && this.currentStraightLine.start[1] === this.currentStraightLine.stop[1]) {
        // It's control point
        return;
      }
      ContinuousStraightLineMode.Reproduce(this.predictCanvas, this.currentStraightLine);
    }
  }

  public OnMoveComplete(pointerHasMoved: boolean, button: number): StraightLine | null {
    this.movingControlPoint = button !== 0;
    this.predictCanvas.clear();

    if (button === 0) {
      this.controlPointPosition = this.lastPointer;
      this.DrawControlDot();

      if (this.currentStraightLine.start[0] === this.currentStraightLine.stop[0]
        && this.currentStraightLine.start[1] === this.currentStraightLine.stop[1]) {
        // It's control point
        return null;
      }
      ContinuousStraightLineMode.Reproduce(this.mainCanvas, this.currentStraightLine);
      return this.currentStraightLine.Duplicate();
    }

    this.DrawControlDot();
    return null;
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
    this.predictCanvas.fillStyle = 'rebeccapurple';
    this.predictCanvas.fill();
  }

  public OnSettingsUpdate(settings: Settings): void {
    this.currentStraightLine.width = settings.width;
    this.currentStraightLine.color = settings.color;
    super.OnSettingsUpdate(settings);
  }
}
