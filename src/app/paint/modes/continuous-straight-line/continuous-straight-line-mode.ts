import { Protocol } from '../../protocol/protocol';
import { Point } from '../../protocol/point';
import { StraightLine } from '../../compiled-objects/straight-line';
import { PaintMode } from '../paint-mode';
import { Box } from '../../compiled-objects/box';
import { PaintManager } from '../../managers/paint-manager';
import { NetworkManager } from '../../managers/network-manager';

export class ContinuousStraightLineMode extends PaintMode {
  private currentStraightLine: StraightLine;
  private currentControlPoint: Point;
  private movingControlPoint = false;

  constructor(predictCanvas: CanvasRenderingContext2D, paintManager: PaintManager, networkManager: NetworkManager) {
    super('continuous-straight-line', predictCanvas, paintManager, networkManager);

    /*this.subModes = new Map<string, SubMode>([
      ['mouse', new ContinuousStraightLineModeMouse(this)],
      ['pen', new ContinuousStraightLineModePen(this)],
      ['touch', new ContinuousStraightLineModeTouch(this)],
    ]);*/
  }

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
        this.currentStraightLine = new StraightLine(this, Protocol.generateId(), this.paintManager.getSettings<string>('color'), this.paintManager.getSettings<number>('width'), normalized, normalized);

        if (this.currentControlPoint) {
          this.currentStraightLine.begin = this.currentControlPoint;
        }
      }
    } else {
      this.currentStraightLine = new StraightLine(this, Protocol.generateId(), this.paintManager.getSettings<string>('color'), this.paintManager.getSettings<number>('width'), this.currentControlPoint ? this.currentControlPoint : normalized, normalized);
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
    this.predictCanvasCTX.clear();

    if (this.currentStraightLine) {
      this.currentStraightLine.box = Box.fromPoints(this.currentStraightLine.begin, this.currentStraightLine.end);
      this.reproduceObject(this.predictCanvasCTX, this.currentStraightLine);
      this.networkManager.shareCompiledObject(this.currentStraightLine, false);
    }

    if (!!this.currentControlPoint) {
      this.predictCanvasCTX.dot(this.currentControlPoint, this.paintManager.getSettings<number>('width') * 2.5, 'orange');
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

        this.currentStraightLine.box = Box.fromPoints(this.currentStraightLine.begin, this.currentStraightLine.end);
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

      this.currentStraightLine.box = Box.fromPoints(this.currentStraightLine.begin, this.currentStraightLine.end);
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
    this.predictCanvasCTX.clear();
  }

  public makeReady(): void {
    this.paintManager.singleFrameUpdate();
  }

  public serializeObject(object: StraightLine, builder = new Protocol.Builder()): Protocol.Builder {
    builder.setName('straight-line');
    builder.setProperty('i', object.id);
    builder.setProperty('c', object.color);
    builder.setProperty('w', object.width);
    builder.setProperty('x', object.box);
    builder.setProperty('b', object.begin);
    builder.setProperty('e', object.end);
    return builder;
  }

  public reproduceObject(canvas: CanvasRenderingContext2D, object: StraightLine, color?: string, width?: number): void {
    canvas.beginPath();
    canvas.moveTo(object.begin.x, object.begin.y);
    canvas.lineTo(object.end.x, object.end.y);
    canvas.lineCap = 'round';
    canvas.lineWidth = width ?? object.width;
    canvas.strokeStyle = color ?? object.color;
    canvas.stroke();
  }
}
