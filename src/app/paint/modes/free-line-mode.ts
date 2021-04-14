import { PaintMode } from './paint-mode';
import { CardinalSpline } from '../curves/cardinal-spline';
import { LazyBrush } from '../curves/lazy-brush';
import { Protocol } from '../protocol/protocol';
import { Box, CompiledObject } from '../protocol/compiled-object';
import { Point } from '../protocol/point';
import { Quadrangle } from '../curves/quadrangle';

export class FreeLine implements CompiledObject {
  static readonly DEBUG_IS_SELECTED_BY = false;
  name = 'free-line';
  color: string;
  width: number;
  points: Point[];
  id: string;
  private readonly box: Box;
  private readonly advancedBox: Path2D[] = [];

  constructor(id?: string, color?: string, width?: number, points?: Point[], box?: Box) {
    this.id = id;
    this.color = color;
    this.width = width;
    this.points = points;
    this.box = box;
  }

  public getBox(): Box {
    return this.box;
  }

  public getAdvancedBox(): Path2D[] {
    return this.advancedBox;
  }

  public isSelectedBy(ctx: CanvasRenderingContext2D, pointer: Point): boolean {

    if (FreeLine.DEBUG_IS_SELECTED_BY) {
      // Draw box
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.box(this.box);

      for (const point of this.points) {
        ctx.dot(point, 10, 'orange');
      }
    }

    // Light check
    if (!this.box.isPointInside(pointer)) {
      return false;
    }

    // Only light check for dots
    if (this.points.length === 1) {
      return true;
    }

    // Prepare advancedBox
    if (this.advancedBox.length + 1 < this.points.length) {
      for (let i = 1; i < this.points.length; i++) {
        const p1 = this.points[i - 1];
        const p2 = this.points[i];

        this.advancedBox.push(Quadrangle.constructOnPoints(p1, p2, this.width / 2));
      }
    }

    // Hard check
    for (const path of this.advancedBox) {

      const isIn = ctx.isPointInPath(path, pointer.x, pointer.y);

      if (FreeLine.DEBUG_IS_SELECTED_BY) {
        ctx.strokeStyle = isIn ? 'purple' : this.color;
        ctx.lineWidth = 2;
        ctx.stroke(path);
      }

      if (isIn) {
        return true;
      }
    }

    return false;
  }
}

export class FreeLineMode extends PaintMode {
  readonly name = 'free-line';
  public currentSpline: CardinalSpline;
  private currentLazyBrush: LazyBrush;
  private compiled: CompiledObject;
  private box: Box;
  private currentGUID: string;
  private lineChanged: boolean;
  private lastPointer: Point;

  public reproduceObject(canvas: CanvasRenderingContext2D, object: FreeLine, color?: string, width?: number): void {
    CardinalSpline.reproduce(canvas, color ?? object.color, width ?? object.width, object.points);
  }

  public serializeObject(object: FreeLine, builder = new Protocol.Builder()): Protocol.Builder {
    builder.setProperty('i', object.id);
    builder.setProperty('c', object.color);
    builder.setProperty('w', object.width);
    builder.setProperty('p', object.points);

    return builder;
  }

  public readObject(reader: Protocol.Reader): FreeLine | boolean {

    const freeLine = new FreeLine();

    reader.addMapping<string>('i', 'id', freeLine, Protocol.readString);
    reader.addMapping<string>('c', 'color', freeLine, Protocol.readString);
    reader.addMapping<number>('w', 'width', freeLine, Protocol.readNumber);
    reader.addArrayMapping<Point>('p', 'points', freeLine, Protocol.readPoint);

    reader.read();

    return freeLine;
  }

  public onPointerDown(event: PointerEvent): void {
    const point = new Point(event.offsetX, event.offsetY);
    const normalizedPoint = this.paintManager.normalizePoint(point);
    // Start new spline
    this.currentSpline = new CardinalSpline(this.predictCanvas, this.settings.tolerance, this.settings.width, this.settings.color);
    // Add starting point
    this.currentSpline.addPoint(normalizedPoint);
    // Create box
    this.box = new Box(normalizedPoint.duplicate(), normalizedPoint.duplicate());
    // Initialize lazy brush
    this.currentLazyBrush = new LazyBrush(this.settings.lazyMultiplier, normalizedPoint);
    // Generate GUID
    this.currentGUID = Protocol.generateId();
    // Requires resending
    this.lineChanged = true;
    // Enable rendering
    this.paintManager.startFrameUpdate();
  }

  public onPointerMove(event: PointerEvent): void {
    if (!this.currentSpline) {
      return;
    }

    const point = new Point(event.offsetX, event.offsetY);
    const normalizedPoint = this.paintManager.normalizePoint(point);

    const boxPadding = this.settings.width * 10;

    // Count hit box
    if (normalizedPoint.x - boxPadding < this.box.topLeft.x) {
      this.box.topLeft.x = normalizedPoint.x - boxPadding;
    } else if (normalizedPoint.x + boxPadding > this.box.bottomRight.x) {
      this.box.bottomRight.x = normalizedPoint.x + boxPadding;
    }

    if (normalizedPoint.y - boxPadding < this.box.topLeft.y) {
      this.box.topLeft.y = normalizedPoint.y - boxPadding;
    } else if (normalizedPoint.y + boxPadding > this.box.bottomRight.y) {
      this.box.bottomRight.y = normalizedPoint.y + boxPadding;
    }

    // When lazy is enabled changes to line should be done on frame update
    if (this.settings.lazyEnabled) {
      // Save for lazy update
      this.lastPointer = normalizedPoint;
    } else {
      // Add point.ts
      this.currentSpline.addPoint(normalizedPoint);

      // Requires resending
      this.lineChanged = true;
    }
  }

  public onFrameUpdate(): void {
    // Changes to line are done here because of nature of lazy brush, brush is always trying to catch pointer,
    // so where pointer stops moving lazy brush must be updated continuously
    if (this.settings.lazyEnabled && !!this.lastPointer) {

      // Update lazy brush
      this.currentLazyBrush.update(this.lastPointer);

      // Requires resending
      if (this.currentLazyBrush.moved) {
        this.lineChanged = true;
        this.currentSpline.addPoint(this.currentLazyBrush.get());
      }
    }

    if (!this.lineChanged) {
      return;
    }

    this.lineChanged = false;

    if (this.currentSpline.optimized.length === 1) {
      const center = this.currentSpline.optimized[0];
      const boxPadding = this.settings.width;
      this.box = new Box(new Point(center.x - boxPadding, center.y - boxPadding), new Point(center.x + boxPadding, center.y + boxPadding));
    }

    // Send to others
    this.compiled = new FreeLine(this.currentGUID, this.settings.color, this.settings.width, this.currentSpline.optimized, this.box);
    this.networkManager.shareCompiledObject(this.compiled, false);

    // Draw predicted line
    this.predictCanvas.clear();

    if (this.currentSpline.optimized?.length) {
      CardinalSpline.reproduce(this.predictCanvas, this.settings.color, this.settings.width, this.currentSpline.optimized);
    } else {
      console.warn('Missing line (this should not be possible)');
    }
  }

  public onPointerUp(event: PointerEvent): void {
    if (!this.currentGUID) {
      return this.paintManager.stopFrameUpdate();
    }

    // End spline with saving, this method will draw itself
    this.predictCanvas.clear();
    this.paintManager.saveCompiledObject(this.compiled);
    this.networkManager.shareCompiledObject(this.compiled, true);

    // Cleanup
    this.paintManager.stopFrameUpdate();
    delete this?.box;
    delete this?.lastPointer;
    delete this?.currentLazyBrush;
    delete this?.currentSpline;
    delete this?.currentGUID;
  }

  public onPointerCancel(event: PointerEvent): void {
    // Send delete
    this.networkManager.sendDelete(this.currentGUID);

    // End spline and delete result
    this.predictCanvas.clear();
    delete this?.box;
    delete this?.lastPointer;
    delete this?.currentLazyBrush;
    delete this?.currentSpline;
    delete this?.currentGUID;
  }

  public onPointerOut(event: PointerEvent): void {
    this.onPointerUp(event);
  }

  public onSelected(): void {
    this.paintManager.stopFrameUpdate();
  }
}
