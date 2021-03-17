import {CompiledObject, PaintMode} from './paint-mode';
import {Settings} from '../../settings/settings.interface';
import {Protocol} from '../../paint/protocol';

export class StraightLine implements CompiledObject {
  name = 'straight-line';
  color: string;
  width: number;
  begin: Int16Array;
  end: Int16Array;
  id: string;

  constructor(id: string, color?: string, width?: number, start?: Int16Array, stop?: Int16Array) {
    this.id = id;
    this.color = color;
    this.width = width;
    this.begin = start ?? new Int16Array(2);
    this.end = stop ?? new Int16Array(2);
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
  private currentControlPoint: Uint32Array;
  private movingControlPoint = false;

  public ReproduceObject(canvas: CanvasRenderingContext2D, object: StraightLine): void {
    canvas.beginPath();
    canvas.moveTo(object.begin[0], object.begin[1]);
    canvas.lineTo(object.end[0], object.end[1]);
    canvas.lineCap = 'round';
    canvas.lineWidth = object.width;
    canvas.strokeStyle = object.color;
    canvas.stroke();
  }

  public SerializeObject(object: StraightLine): string {
    // String builder
    const sb = [];

    sb.push(`n:${object.name}`);
    sb.push(`i:${object.id}`);
    sb.push(`c:${object.color}`);
    sb.push(`w:${object.width}`);

    sb.push(`b:${object.begin[0]};${object.begin[1]}`);
    sb.push(`e:${object.end[0]};${object.end[1]}`);

    return sb.join(',');
  }

  public ReadObject(data: string, currentPosition = {value: 0}): StraightLine | boolean {
    const straightLine = new StraightLine(Protocol.ReadString(data, 'i', currentPosition));

    // Read color
    straightLine.color = Protocol.ReadString(data, 'c', currentPosition);
    // Read width
    straightLine.width = Protocol.ReadNumber(data, 'w', currentPosition);
    // Read begin
    straightLine.begin = Protocol.ReadPoint<Int16Array>(Int16Array, data, currentPosition);
    // Read end
    straightLine.end = Protocol.ReadPoint<Int16Array>(Int16Array, data, currentPosition);
    return straightLine;
  }

  public OnSelected(): void {
    delete this.currentControlPoint;
  }

  public OnPointerDown(event: PointerEvent): void {
    const point = new Int16Array([event.offsetX, event.offsetY]);
    const normalized = Int16Array.from(this.manager.NormalizePoint(point));
    this.manager.StartFrameUpdate();

    // PC only
    if (event.pointerType === 'mouse') {
      // Control point move on right click
      if (event.button === 2) {
        this.currentControlPoint = Uint32Array.from(normalized);
        this.movingControlPoint = true;
      } else if (event.button === 0) {
        // Line from pointer location or to pointer location
        if (!!this.currentControlPoint) {
          this.currentStraightLine = new StraightLine(null, this.settings.color, this.settings.width, Int16Array.from(this.currentControlPoint), normalized);
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
    const point = new Int16Array([event.offsetX, event.offsetY]);
    const normalized = this.manager.NormalizePoint(point);

    if (event.pointerType === 'mouse') {
      if (this.movingControlPoint) {
        this.currentControlPoint = Uint32Array.from(normalized);
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
        // Set control point
        this.currentControlPoint = Uint32Array.from(this.currentStraightLine.begin);
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
