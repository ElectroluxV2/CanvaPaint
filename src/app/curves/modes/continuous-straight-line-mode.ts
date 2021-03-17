import {PaintMode} from './paint-mode';
import {StraightLine} from './straight-line-mode';
import {Protocol} from '../../paint/protocol';

export class ContinuousStraightLineMode extends PaintMode {
  readonly name = 'continuous-straight-line';
  private currentStraightLine: StraightLine;
  private currentControlPoint: Uint32Array;
  private movingControlPoint = false;

  public OnPointerDown(event: PointerEvent): void {
    this.manager.StartFrameUpdate();

    const point = new Uint32Array([event.offsetX, event.offsetY]);
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
    const point = new Uint32Array([event.offsetX, event.offsetY]);
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
    const point = new Uint32Array([event.offsetX, event.offsetY]);
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
    canvas.moveTo(object.begin[0], object.begin[1]);
    canvas.lineTo(object.end[0], object.end[1]);
    canvas.lineCap = 'round';
    canvas.lineWidth = object.width;
    canvas.strokeStyle = object.color;
    canvas.stroke();
  }

  public SerializeObject(object: StraightLine): string {
    return '';
  }

  public ReadObject(data: string): boolean {
    return false;
  }
}
