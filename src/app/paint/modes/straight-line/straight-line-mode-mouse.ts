import { SubMode } from '../sub-mode';
import { Point } from '../../protocol/point';
import { StraightLine } from '../../compiled-objects/straight-line';
import { Protocol } from '../../protocol/protocol';
import { Box } from '../../compiled-objects/box';

export class StraightLineModeMouse extends SubMode {
  private currentStraightLine: StraightLine;
  private currentControlPoint: Point;
  private movingControlPoint = false;

  constructor(parentMode, private reproduceObject: (canvas: CanvasRenderingContext2D, object: StraightLine, color?: string, width?: number) => void) {
    super(parentMode);
  }

  public onSelected(): void {
    delete this.currentControlPoint;
  }

  public onPointerDown(event: PointerEvent): void {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);
    this.parentMode.paintManager.startFrameUpdate();

    // Control point move on right click
    if (event.button === 2) {
      this.currentControlPoint = normalized;
      this.movingControlPoint = true;
    } else if (event.button === 0) {
      // Line from pointer location or to pointer location
      if (!!this.currentControlPoint) {
        this.currentStraightLine = new StraightLine(this.parentMode, Protocol.generateId(), this.paintManager.getSettings<string>('color'), this.paintManager.getSettings<number>('width'), this.currentControlPoint, normalized);
      } else {
        this.currentStraightLine = new StraightLine(this.parentMode, Protocol.generateId(), this.paintManager.getSettings<string>('color'), this.paintManager.getSettings<number>('width'), normalized, normalized);
      }
    }
  }

  public onPointerMove(event: PointerEvent): void {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);

    if (this.movingControlPoint) {
      this.currentControlPoint = normalized;
    } else if (!!this.currentStraightLine) {
      this.currentStraightLine.end = normalized;
    }
  }

  public onPointerUp(event: PointerEvent): void {

    this.movingControlPoint = false;
    if (event.button === 0) {
      this.currentStraightLine.box = Box.fromPoints(this.currentStraightLine.begin, this.currentStraightLine.end);
      this.paintManager.saveCompiledObject(this.currentStraightLine);
      this.networkManager.shareCompiledObject(this.currentStraightLine, true);
      // Set control point.ts
      this.currentControlPoint = this.currentStraightLine.begin;
      this.predictCanvasCTX.dot(this.currentControlPoint, this.paintManager.getSettings<number>('width') * 2.5, 'orange');
    }

    this.paintManager.stopFrameUpdate();
    delete this.currentStraightLine;
  }

  public onFrameUpdate(): void {
    this.predictCanvasCTX.clear();

    if (!!this.currentStraightLine) {
      this.currentStraightLine.box = Box.fromPoints(this.currentStraightLine.begin, this.currentStraightLine.end);
      this.reproduceObject(this.predictCanvasCTX, this.currentStraightLine);
      this.networkManager.shareCompiledObject(this.currentStraightLine, false);
    }

    if (!!this.currentControlPoint) {
      this.predictCanvasCTX.dot(this.currentControlPoint, this.paintManager.getSettings<number>('width') * 2.5, 'orange');
    }
  }

  public makeReady(): void {
    if (!!this.currentControlPoint) {
      this.predictCanvasCTX.dot(this.currentControlPoint, this.paintManager.getSettings<number>('width') * 2.5, 'orange');
    }
  }

  public onUnSelected(): void {
    this.predictCanvasCTX.clear();
  }
}
