import { PaintMode } from './paint-mode';
import { Point } from '../protocol/point';
import { Protocol } from '../protocol/protocol';
import { StraightLine } from '../compiled-objects/straight-line';
import { Box } from '../protocol/compiled-object';

export class StraightLineMode extends PaintMode {
  readonly name = 'straight-line';
  private currentStraightLine: StraightLine;
  private currentControlPoint: Point;
  private movingControlPoint = false;

  public reproduceObject(canvas: CanvasRenderingContext2D, object: StraightLine, color?: string, width?: number): void {
    canvas.beginPath();
    canvas.moveTo(object.begin.x, object.begin.y);
    canvas.lineTo(object.end.x, object.end.y);
    canvas.lineCap = 'round';
    canvas.lineWidth = width ?? object.width;
    canvas.strokeStyle = color ?? object.color;
    canvas.stroke();
  }

  public serializeObject(object: StraightLine, builder = new Protocol.Builder()): Protocol.Builder {
    builder.setProperty('i', object.id);
    builder.setProperty('c', object.color);
    builder.setProperty('w', object.width);
    builder.setProperty('x', object.box);
    builder.setProperty('b', object.begin);
    builder.setProperty('e', object.end);
    return builder;
  }

  public readObject(reader: Protocol.Reader): StraightLine | boolean {
    const straightLine = new StraightLine();

    reader.addMapping<string>('i', 'id', straightLine, Protocol.readString);
    reader.addMapping<string>('c', 'color', straightLine, Protocol.readString);
    reader.addMapping<number>('w', 'width', straightLine, Protocol.readNumber);
    reader.addMapping<Box>('x', 'box', straightLine, Protocol.readBox);
    reader.addMapping<Point>('b', 'begin', straightLine, Protocol.readPoint);
    reader.addMapping<Point>('e', 'end', straightLine, Protocol.readPoint);

    reader.read();

    return straightLine;
  }

  public onSelected(): void {
    delete this.currentControlPoint;
  }

  public onPointerDown(event: PointerEvent): void {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);
    this.paintManager.startFrameUpdate();

    // PC only
    if (event.pointerType === 'mouse') {
      // Control point.ts move on right click
      if (event.button === 2) {
        this.currentControlPoint = normalized;
        this.movingControlPoint = true;
      } else if (event.button === 0) {
        // Line from pointer location or to pointer location
        if (!!this.currentControlPoint) {
          this.currentStraightLine = new StraightLine(Protocol.generateId(), this.settings.color, this.settings.width, this.currentControlPoint, normalized);
        } else {
          this.currentStraightLine = new StraightLine(Protocol.generateId(), this.settings.color, this.settings.width, normalized, normalized);
        }
      }
    } else {
      // Others
      this.currentStraightLine = new StraightLine(Protocol.generateId(), this.settings.color, this.settings.width, normalized, normalized);
    }
  }

  public onPointerMove(event: PointerEvent): void {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);

    if (event.pointerType === 'mouse') {
      if (this.movingControlPoint) {
        this.currentControlPoint = normalized;
      } else if (!!this.currentStraightLine){
        this.currentStraightLine.end = normalized;
      }
    } else {
      if (!this.currentStraightLine) {
        return;
      }
      this.currentStraightLine.end = normalized;
    }
  }

  public onPointerUp(event: PointerEvent): void {
    if (event.pointerType === 'mouse') {
      this.movingControlPoint = false;
      if (event.button === 0) {
        this.currentStraightLine.box = Box.fromPoints(this.currentStraightLine.begin, this.currentStraightLine.end);
        this.paintManager.saveCompiledObject(this.currentStraightLine);
        this.networkManager.shareCompiledObject(this.currentStraightLine, true);
        // Set control point.ts
        this.currentControlPoint = this.currentStraightLine.begin;
        this.predictCanvas.dot(this.currentControlPoint, this.settings.width * 2.5, 'orange');
      }
    } else {
      this.currentStraightLine.box = Box.fromPoints(this.currentStraightLine.begin, this.currentStraightLine.end);
      this.paintManager.saveCompiledObject(this.currentStraightLine);
      this.networkManager.shareCompiledObject(this.currentStraightLine, true);
    }

    this.paintManager.stopFrameUpdate();
    delete this.currentStraightLine;
  }

  public onFrameUpdate(): void {
    this.predictCanvas.clear();

    if (!!this.currentStraightLine) {
      this.currentStraightLine.box = Box.fromPoints(this.currentStraightLine.begin, this.currentStraightLine.end);
      this.reproduceObject(this.predictCanvas, this.currentStraightLine);
      this.networkManager.shareCompiledObject(this.currentStraightLine, false);
    }

    if (!!this.currentControlPoint) {
      this.predictCanvas.dot(this.currentControlPoint, this.settings.width * 2.5, 'orange');
    }
  }

  public makeReady(): void {
    if (!!this.currentControlPoint) {
      this.predictCanvas.dot(this.currentControlPoint, this.settings.width * 2.5, 'orange');
    }
  }

  public onUnSelected(): void {
    this.predictCanvas.clear();
  }
}
