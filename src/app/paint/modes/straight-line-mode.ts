import {PaintMode} from './paint-mode';
import {Settings} from '../../settings/settings.interface';
import {CompiledObject} from '../protocol/compiled-object';
import {Point} from '../protocol/point';
import {Protocol} from '../protocol/protocol';
import {PacketType} from '../protocol/packet-types';

export class StraightLine implements CompiledObject {
  name = 'straight-line';
  color: string;
  width: number;
  begin: Point;
  end: Point;
  id: string;

  constructor(id?: string, color?: string, width?: number, start?: Point, stop?: Point) {
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
    const builder = new Protocol.Builder();
    builder.SetType(PacketType.OBJECT);
    builder.SetName('straight-line');

    builder.SetProperty('i', object.id);
    builder.SetProperty('c', object.color);
    builder.SetProperty('w', object.width);
    builder.SetProperty('b', object.begin);
    builder.SetProperty('e', object.end);
    return builder.ToString();
  }

  public ReadObject(data: string, currentPosition = {value: 0}): StraightLine | boolean {
    const straightLine = new StraightLine();
    const reader = new Protocol.Reader(data, currentPosition);

    reader.AddMapping<string>('i', 'id', straightLine, Protocol.ReadString);
    reader.AddMapping<string>('c', 'color', straightLine, Protocol.ReadString);
    reader.AddMapping<number>('w', 'width', straightLine, Protocol.ReadNumber);
    reader.AddMapping<Point>('b', 'begin', straightLine, Protocol.ReadPoint);
    reader.AddMapping<Point>('e', 'end', straightLine, Protocol.ReadPoint);

    reader.Read();

    return straightLine;
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
          this.currentStraightLine = new StraightLine(Protocol.GenerateId(), this.settings.color, this.settings.width, this.currentControlPoint, normalized);
        } else {
          this.currentStraightLine = new StraightLine(Protocol.GenerateId(), this.settings.color, this.settings.width, normalized, normalized);
        }
      }
    } else {
      // Others
      this.currentStraightLine = new StraightLine(Protocol.GenerateId(), this.settings.color, this.settings.width, normalized, normalized);
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
        this.manager.ShareCompiledObject(this.currentStraightLine, true);
        // Set control point.ts
        this.currentControlPoint = this.currentStraightLine.begin;
        this.predictCanvas.dot(this.currentControlPoint, this.settings.width * 2.5, 'orange');
      }
    } else {
      this.manager.SaveCompiledObject(this.currentStraightLine);
      this.manager.ShareCompiledObject(this.currentStraightLine, true);
    }

    this.manager.StopFrameUpdate();
    delete this.currentStraightLine;
  }

  public OnFrameUpdate(): void {
    this.predictCanvas.clear();

    if (!!this.currentStraightLine) {
      this.ReproduceObject(this.predictCanvas, this.currentStraightLine);
      this.manager.ShareCompiledObject(this.currentStraightLine, false);
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
