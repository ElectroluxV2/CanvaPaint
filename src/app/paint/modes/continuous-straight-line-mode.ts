import {PaintMode} from './paint-mode';
import {StraightLine} from './straight-line-mode';
import {Protocol} from '../protocol/protocol';
import {Point} from '../protocol/point';
import {PacketType} from '../protocol/packet-types';

export class ContinuousStraightLineMode extends PaintMode {
  readonly name = 'continuous-straight-line';
  private currentStraightLine: StraightLine;
  private currentControlPoint: Point;
  private movingControlPoint = false;

  public OnPointerDown(event: PointerEvent): void {
    this.manager.StartFrameUpdate();

    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.manager.NormalizePoint(point);

    if (event.button === 2) {
      this.currentControlPoint = normalized;
      this.movingControlPoint = true;

    } else if (event.button === 0) {
      this.currentStraightLine = new StraightLine(Protocol.GenerateId(), this.settings.color, this.settings.width, normalized, normalized);

      if (this.currentControlPoint) {
        this.currentStraightLine.begin = this.currentControlPoint;
      }
    }
  }

  public OnPointerMove(event: PointerEvent) {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.manager.NormalizePoint(point);

    if (this.movingControlPoint) {
      this.currentControlPoint = normalized;
    } else if (this.currentStraightLine) {
      this.currentStraightLine.end = normalized;
    }
  }

  public OnFrameUpdate(): void {
    this.predictCanvas.clear();

    if (this.currentStraightLine) {
      this.ReproduceObject(this.predictCanvas, this.currentStraightLine);

      this.manager.ShareCompiledObject(this.currentStraightLine, false);
    }

    if (!!this.currentControlPoint) {
      this.predictCanvas.dot(this.currentControlPoint, this.settings.width * 2.5, 'orange');
    }
  }

  public OnPointerUp(event: PointerEvent): void {
    this.manager.StopFrameUpdate();
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.manager.NormalizePoint(point);

    if (event.button === 2) {
      this.currentControlPoint = normalized;
      this.movingControlPoint = false;

    } else if (event.button === 0) {
      if (this.currentControlPoint) {
        this.currentStraightLine.begin = this.currentControlPoint;
      }

      this.currentStraightLine.end = normalized;
      this.currentControlPoint = normalized;

      this.manager.SaveCompiledObject(this.currentStraightLine);
      this.manager.ShareCompiledObject(this.currentStraightLine, true);
      this.manager.SingleFrameUpdate();

      delete this.currentStraightLine;
    }
  }

  public OnSelected(): void {
    delete this?.currentStraightLine;
    delete this?.currentControlPoint;
  }

  public OnUnSelected(): void {
    this.predictCanvas.clear();
  }

  public MakeReady(): void {
    this.manager.SingleFrameUpdate();
  }

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

  public ReadObject(data: string): boolean {
    return false;
  }
}
