import {PaintMode} from './paint-mode';
import {Settings} from '../../../settings/settings.interface';
import {CompiledObject} from '../../protocol/compiled-object';
import {Point} from '../../protocol/point';

export class StraightLine implements CompiledObject {
  name = 'straight-line';
  color: string;
  width: number;
  begin: Point;
  end: Point;
  id: string;

  constructor(id: string, color?: string, width?: number, start?: Point, stop?: Point) {
    this.id = id;
    this.color = color;
    this.width = width;
    this.begin = start ?? new Point(2);
    this.end = stop ?? new Point(2);
  }

  public Duplicate(): StraightLine {
    return new StraightLine(this.id, this.color, this.width, this.begin, this.end);
  }

  public ApplySettings(settings: Settings): void {
    this.width = settings.width;
    this.color = settings.color;
  }
}

export class StraightLineMode extends PaintMode {
  readonly name = 'straight-line';
  private currentStraightLine: StraightLine;
  private currentControlPoint: Point;
  private movingControlPoint = false;

  public ReproduceObject(canvas: CanvasRenderingContext2D, object: StraightLine): void {
    canvas.beginPath();
    canvas.moveTo(object.begin.x, object.begin.y);
    canvas.lineTo(object.end.x, object.end.y);
    canvas.lineCap = 'round';
    canvas.lineWidth = object.width;
    canvas.strokeStyle = object.color;
    canvas.stroke();
  }

  public SerializeObject(object: StraightLine): string {
    /*// String builder
    const sb = [];

    sb.push(`n:${object.name}`);
    sb.push(`i:${object.id}`);
    sb.push(`c:${object.color}`);
    sb.push(`w:${object.width}`);

    sb.push(`b:${object.begin.x};${object.begin.y}`);
    sb.push(`e:${object.end.x};${object.end.y}`);

    return sb.join(',');*/
    return '';
  }

  public ReadObject(data: string, currentPosition = {value: 0}): StraightLine | boolean {
    /*const straightLine = new StraightLine(Protocol.ReadString(data, 'i', currentPosition));

    // Read color
    straightLine.color = Protocol.ReadString(data, 'c', currentPosition);
    // Read width
    straightLine.width = Protocol.ReadNumber(data, 'w', currentPosition);
    // Read begin
    straightLine.begin = Protocol.ReadPoint(data, currentPosition);
    // Read end
    straightLine.end = Protocol.ReadPoint(data, currentPosition);
    return straightLine;*/
    return false;
  }

  public OnSelected(): void {
    delete this.currentControlPoint;
  }

  public OnPointerDown(event: PointerEvent): void {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.manager.NormalizePoint(point);
    this.manager.StartFrameUpdate();

    // PC only
    if (event.pointerType === 'mouse') {
      // Control point.ts move on right click
      if (event.button === 2) {
        this.currentControlPoint = normalized;
        this.movingControlPoint = true;
      } else if (event.button === 0) {
        // Line from pointer location or to pointer location
        if (!!this.currentControlPoint) {
          this.currentStraightLine = new StraightLine(null, this.settings.color, this.settings.width, this.currentControlPoint, normalized);
        } else {
          this.currentStraightLine = new StraightLine(null, this.settings.color, this.settings.width, normalized, normalized);
        }
      }
    } else {
      // Others
      this.currentStraightLine = new StraightLine(null, this.settings.color, this.settings.width, normalized, normalized);
    }
  }

  public OnPointerMove(event: PointerEvent): void {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.manager.NormalizePoint(point);

    if (event.pointerType === 'mouse') {
      if (this.movingControlPoint) {
        this.currentControlPoint = normalized;
      } else if (!!this.currentStraightLine){
        this.currentStraightLine.end = normalized;
      }
    } else {
      if (!this.currentStraightLine) { return; }
      this.currentStraightLine.end = normalized;
    }
  }

  public OnPointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.movingControlPoint = false;
      if (event.button === 0) {
        this.manager.SaveCompiledObject(this.currentStraightLine);
        // Set control point.ts
        this.currentControlPoint = this.currentStraightLine.begin;
        this.predictCanvas.dot(this.currentControlPoint, this.settings.width * 2.5, 'orange');
      }
    } else {
      this.manager.SaveCompiledObject(this.currentStraightLine);
    }

    this.manager.StopFrameUpdate();
    delete this.currentStraightLine;
  }

  public OnFrameUpdate(): void {
    this.predictCanvas.clear();

    if (!!this.currentStraightLine) {
      this.ReproduceObject(this.predictCanvas, this.currentStraightLine);
    }

    if (!!this.currentControlPoint) {
      this.predictCanvas.dot(this.currentControlPoint, this.settings.width * 2.5, 'orange');
    }
  }

  public MakeReady(): void {
    if (!!this.currentControlPoint) {
      this.predictCanvas.dot(this.currentControlPoint, this.settings.width * 2.5, 'orange');
    }
  }

  public OnUnSelected(): void {
    this.predictCanvas.clear();
  }
}
