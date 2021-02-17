import {CompiledObject, PaintMode} from './paint-mode';
import {Settings} from '../../settings/settings.interface';

export class StraightLine implements CompiledObject {
  name = 'straight-line';
  color: string;
  width: number;
  start: Uint32Array;
  stop: Uint32Array;

  constructor(color: string, width: number, start?: Uint32Array, stop?: Uint32Array) {
    this.color = color;
    this.width = width;
    this.start = start ?? new Uint32Array(2);
    this.stop = stop ?? new Uint32Array(2);
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
  private currentStraightLine: StraightLine;
  private currentControlPoint: Uint32Array;
  private movingControlPoint = false;

  public Reproduce(canvas: CanvasRenderingContext2D, object: StraightLine): void {
    canvas.beginPath();
    canvas.moveTo(object.start[0], object.start[1]);
    canvas.lineTo(object.stop[0], object.stop[1]);
    canvas.lineCap = 'round';
    canvas.lineWidth = this.settings.width;
    canvas.strokeStyle = this.settings.color;
    canvas.stroke();
  }

  public OnSelected(): void {
    delete this.currentControlPoint;
  }

  public OnPointerDown(event: PointerEvent): void {
    const point = new Uint32Array([event.offsetX, event.offsetY]);
    const normalized = this.manager.NormalizePoint(point);
    this.manager.StartFrameUpdate();

    // PC only
    if (event.pointerType === 'mouse') {
      // Control point move on right click
      if (event.button === 2) {
        this.currentControlPoint = normalized;
        this.movingControlPoint = true;
      } else if (event.button === 0) {
        // Line from pointer location or to pointer location
        if (!!this.currentControlPoint) {
          this.currentStraightLine = new StraightLine(this.settings.color, this.settings.width, this.currentControlPoint, normalized);
        } else {
          this.currentStraightLine = new StraightLine(this.settings.color, this.settings.width, normalized, normalized);
        }
      }
    } else {
      // Others
      this.currentStraightLine = new StraightLine(this.settings.color, this.settings.width, normalized, normalized);
    }
  }

  public OnPointerMove(event: PointerEvent): void {
    const point = new Uint32Array([event.offsetX, event.offsetY]);
    const normalized = this.manager.NormalizePoint(point);

    if (event.pointerType === 'mouse') {
      if (this.movingControlPoint) {
        this.currentControlPoint = normalized;
      } else if (!!this.currentStraightLine){
        this.currentStraightLine.stop = normalized;
      }
    } else {
      if (!this.currentStraightLine) { return; }
      this.currentStraightLine.stop = normalized;
    }
  }

  public OnPointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.movingControlPoint = false;
      if (event.button === 0) {
        this.manager.SaveCompiledObject(this.currentStraightLine);
        // Set control point
        this.currentControlPoint = this.currentStraightLine.start;
      }
    } else {
      this.manager.SaveCompiledObject(this.currentStraightLine);
    }

    //this.manager.StopFrameUpdate();
    delete this.currentStraightLine;
  }

  public OnFrameUpdate(): void {
    this.predictCanvas.clear();

    if (!!this.currentStraightLine) {
      this.Reproduce(this.predictCanvas, this.currentStraightLine);
    }

    if (!!this.currentControlPoint) {
      this.predictCanvas.dot(this.currentControlPoint, this.settings.width * 2.5, 'orange');
    }
  }
}
