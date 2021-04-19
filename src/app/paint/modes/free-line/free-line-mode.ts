import { PaintMode } from '../paint-mode';
import { Protocol } from '../../protocol/protocol';
import { FreeLine } from '../../compiled-objects/free-line';
import { CardinalSpline } from '../../curves/cardinal-spline';
import { Point } from '../../protocol/point';
import { NetworkManager } from '../../network-manager';
import { PaintManager } from '../../paint-manager';
import { LazyBrush } from '../../curves/lazy-brush';
import { Box } from '../../compiled-objects/compiled-object';

export class FreeLineMode extends PaintMode {
  public readonly name = 'free-line';
  public currentSpline: CardinalSpline;
  private currentLazyBrush: LazyBrush;
  private compiled: FreeLine;
  private box: Box;
  private currentId: string;
  private lineChanged: boolean;
  private lastPointer: Point;

  constructor(predictCanvas: CanvasRenderingContext2D, paintManager: PaintManager, networkManager: NetworkManager) {
    super(predictCanvas, paintManager, networkManager);

    /*this.subModes = new Map<string, SubMode>([
      ['mouse', new FreeLineModeMouse(predictCanvas, paintManager, networkManager)],
      ['pen', new FreeLineModePen(predictCanvas, paintManager, networkManager)],
      ['touch', new FreeLineModeTouch(predictCanvas, paintManager, networkManager)],
    ]);*/
  }

  public reproduceObject(canvas: CanvasRenderingContext2D, object: FreeLine, color?: string, width?: number): void {
    CardinalSpline.reproduce(canvas, color ?? object.color, width ?? object.width, object.points);
  }

  public serializeObject(object: FreeLine, builder: Protocol.Builder = new Protocol.Builder()): Protocol.Builder {
    builder.setProperty('i', object.id);
    builder.setProperty('c', object.color);
    builder.setProperty('w', object.width);
    builder.setProperty('b', object.box);
    builder.setProperty('p', object.points);

    return builder;
  }

  public readObject(reader: Protocol.Reader): FreeLine {
    const freeLine = new FreeLine();

    reader.addMapping<string>('i', 'id', freeLine, Protocol.readString);
    reader.addMapping<string>('c', 'color', freeLine, Protocol.readString);
    reader.addMapping<number>('w', 'width', freeLine, Protocol.readNumber);
    reader.addMapping<Box>('b', 'box', freeLine, Protocol.readBox);
    reader.addArrayMapping<Point>('p', 'points', freeLine, Protocol.readPoint);

    reader.read();

    return freeLine;
  }

  public exportObjectSVG(freeLine: FreeLine): string {
    return CardinalSpline.exportSVG(freeLine.points, freeLine.width, freeLine.points.length < 2);
  }

  public onSelected() {
    this.paintManager.stopFrameUpdate();
  }

  public onPointerDown(event: PointerEvent): void {
    const point = new Point(event.offsetX, event.offsetY);
    const normalizedPoint = this.paintManager.normalizePoint(point);
    // Start new spline
    this.currentSpline = new CardinalSpline(this.predictCanvas, this.paintManager.getSettings<number>('tolerance'), this.paintManager.getSettings<number>('width'), this.paintManager.getSettings<string>('color'));
    // Add starting point
    this.currentSpline.addPoint(normalizedPoint);
    // Create box
    this.box = new Box(normalizedPoint.duplicate(), normalizedPoint.duplicate());
    // Initialize lazy brush
    this.currentLazyBrush = new LazyBrush(this.paintManager.getSettings<number>('lazyMultiplier'), normalizedPoint);
    // Generate id
    this.currentId = Protocol.generateId();
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

    const boxPadding = this.paintManager.getSettings<number>('width') * 10;

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
    if (this.paintManager.getSettings<boolean>('lazyEnabled')) {
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
    if (this.paintManager.getSettings<boolean>('lazyEnabled') && !!this.lastPointer) {

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
      const boxPadding = this.paintManager.getSettings<number>('width');
      this.box = new Box(new Point(center.x - boxPadding, center.y - boxPadding), new Point(center.x + boxPadding, center.y + boxPadding));
    }

    // Send to others
    this.compiled = new FreeLine(this.currentId, this.paintManager.getSettings<string>('color'), this.paintManager.getSettings<number>('width'), this.currentSpline.optimized, this.box);
    this.networkManager.shareCompiledObject(this.compiled, false);

    // Draw predicted line
    this.predictCanvas.clear();

    if (this.currentSpline.optimized?.length) {
      CardinalSpline.reproduce(this.predictCanvas, this.paintManager.getSettings<string>('color'), this.paintManager.getSettings<number>('width'), this.currentSpline.optimized);
    } else {
      console.warn('Missing line (this should not be possible)');
    }
  }

  public onPointerUp(event: PointerEvent): void {
    if (!this.currentId) {
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
    delete this?.currentId;
  }
}
