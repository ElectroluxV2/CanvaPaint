import { PaintMode } from './paint-mode';
import { StraightLine } from './straight-line-mode';
import { Protocol } from '../protocol/protocol';
import { Point } from '../protocol/point';

export class ContinuousStraightLineMode extends PaintMode {
  readonly name = 'continuous-straight-line';
  private currentStraightLine: StraightLine;
  private currentControlPoint: Point;
  private movingControlPoint = false;

  public onPointerDown(event: PointerEvent): void {
    this.paintManager.startFrameUpdate();

    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);

    // PC only
    if (event.pointerType === 'mouse') {
      if (event.button === 2) {
        this.currentControlPoint = normalized;
        this.movingControlPoint = true;

      } else if (event.button === 0) {
        this.currentStraightLine = new StraightLine(Protocol.generateId(), this.settings.color, this.settings.width, normalized, normalized);

        if (this.currentControlPoint) {
          this.currentStraightLine.begin = this.currentControlPoint;
        }
      }
    } else {
      this.currentStraightLine = new StraightLine(Protocol.generateId(), this.settings.color, this.settings.width, this.currentControlPoint ? this.currentControlPoint : normalized, normalized);
    }
  }

  public onPointerMove(event: PointerEvent) {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);

    if (this.movingControlPoint) {
      this.currentControlPoint = normalized;
    } else if (this.currentStraightLine) {
      this.currentStraightLine.end = normalized;
    }
  }

  public onFrameUpdate(): void {
    this.predictCanvas.clear();

    if (this.currentStraightLine) {
      this.reproduceObject(this.predictCanvas, this.currentStraightLine);

      this.networkManager.shareCompiledObject(this.currentStraightLine, false);
    }

    if (!!this.currentControlPoint) {
      this.predictCanvas.dot(this.currentControlPoint, this.settings.width * 2.5, 'orange');
    }
  }

  public onPointerUp(event: PointerEvent): void {
    this.paintManager.stopFrameUpdate();
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);

    // PC only
    if (event.pointerType === 'mouse') {
      if (event.button === 2) {
        this.currentControlPoint = normalized;
        this.movingControlPoint = false;

      } else if (event.button === 0) {
        if (this.currentControlPoint) {
          this.currentStraightLine.begin = this.currentControlPoint;
        }

        this.currentStraightLine.end = normalized;
        this.currentControlPoint = normalized;

        this.paintManager.saveCompiledObject(this.currentStraightLine);
        this.networkManager.shareCompiledObject(this.currentStraightLine, true);
        this.paintManager.singleFrameUpdate();

        delete this.currentStraightLine;
      }
    } else {

      if (this.currentControlPoint) {
        this.currentStraightLine.begin = this.currentControlPoint;
      }

      this.currentStraightLine.end = normalized;
      this.currentControlPoint = normalized;

      this.paintManager.saveCompiledObject(this.currentStraightLine);
      this.networkManager.shareCompiledObject(this.currentStraightLine, true);
      this.paintManager.singleFrameUpdate();

      delete this.currentStraightLine;
    }
  }

  public onSelected(): void {
    delete this?.currentStraightLine;
    delete this?.currentControlPoint;
  }

  public onUnSelected(): void {
    this.predictCanvas.clear();
  }

  public makeReady(): void {
    this.paintManager.singleFrameUpdate();
  }

  public reproduceObject(canvas: CanvasRenderingContext2D, object: StraightLine): void {
    canvas.beginPath();
    canvas.moveTo(object.begin.x, object.begin.y);
    canvas.lineTo(object.end.x, object.end.y);
    canvas.lineCap = 'round';
    canvas.lineWidth = object.width;
    canvas.strokeStyle = object.color;
    canvas.stroke();
  }

  public serializeObject(object: StraightLine, builder = new Protocol.Builder()): Protocol.Builder {
    builder.setName('straight-line');
    builder.setProperty('i', object.id);
    builder.setProperty('c', object.color);
    builder.setProperty('w', object.width);
    builder.setProperty('b', object.begin);
    builder.setProperty('e', object.end);
    return builder;
  }

  public readObject(reader: Protocol.Reader): boolean {
    return false;
  }
}
