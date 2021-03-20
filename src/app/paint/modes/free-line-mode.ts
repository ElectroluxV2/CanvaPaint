import { PaintMode } from './paint-mode';
import { CardinalSpline } from '../curves/cardinal-spline';
import { LazyBrush } from '../curves/lazy-brush';
import {Protocol} from '../protocol/protocol';
import {CompiledObject} from '../protocol/compiled-object';
import {Point} from '../protocol/point';
import {PacketType} from '../protocol/packet-types';

export class FreeLine implements CompiledObject {
  name = 'free-line';
  color: string;
  width: number;
  points: Point[];
  id: string;

  constructor(id?: string, color?: string, width?: number, points?: Point[]) {
    this.id = id;
    this.color = color;
    this.width = width;
    this.points = points;
  }
}

export class FreeLineMode extends PaintMode {
  readonly name = 'free-line';
  public currentSpline: CardinalSpline;
  private currentLazyBrush: LazyBrush;
  private compiled: CompiledObject;
  private currentGUID: string;
  private lineChanged: boolean;
  private lastPointer: Point;

  public ReproduceObject(canvas: CanvasRenderingContext2D, object: FreeLine): void {
    CardinalSpline.Reproduce(canvas, object.color, object.width, object.points);
  }

  public SerializeObject(object: FreeLine): string {
    // Protocol Builder
    const protocolBuilder = new Protocol.Builder();

    // THE ORDER MATTERS
    // CORRECT ORDER: t, n and then anything else
    protocolBuilder.SetType(PacketType.OBJECT);
    protocolBuilder.SetName(object.name);

    protocolBuilder.SetProperty('i', object.id);
    protocolBuilder.SetProperty('c', object.color);
    protocolBuilder.SetProperty('w', object.width);
    protocolBuilder.SetProperty('p', object.points);

    return protocolBuilder.ToString();
  }

  public ReadObject(data: string, currentPosition = { value: 0 }): FreeLine | boolean {

    const freeLine = new FreeLine();
    const protocolReader = new Protocol.Reader(data, currentPosition);

    protocolReader.AddMapping<string>('i', 'id', freeLine, Protocol.ReadString);
    protocolReader.AddMapping<string>('c', 'color', freeLine, Protocol.ReadString);
    protocolReader.AddMapping<number>('w', 'width', freeLine, Protocol.ReadNumber);
    protocolReader.AddArrayMapping<Point>('p', 'points', freeLine, Protocol.ReadPoint);

    protocolReader.Read();

    return freeLine;
  }

  public OnPointerDown(event: PointerEvent): void {
    const point = new Point(event.offsetX, event.offsetY);
    const normalizedPoint = this.manager.NormalizePoint(point);
    // Start new spline
    this.currentSpline = new CardinalSpline().Apply(this);
    // Add starting point.ts
    this.currentSpline.AddPoint(normalizedPoint);
    // Initialize lazy brush
    this.currentLazyBrush = new LazyBrush(this.settings.lazyMultiplier, normalizedPoint);
    // Generate GUID
    this.currentGUID = Protocol.GenerateId();
    // Requires resending
    this.lineChanged = true;
    // Enable rendering
    this.manager.StartFrameUpdate();
  }

  public OnPointerMove(event: PointerEvent): void {
    if (!this.currentSpline) { return; }

    const point = new Point(event.offsetX, event.offsetY);
    const normalizedPoint = this.manager.NormalizePoint(point);

    // When lazy is enabled changes to line should be done on frame update
    if (this.settings.lazyEnabled) {
      // Save for lazy update
      this.lastPointer = normalizedPoint;
    } else {
      // Add point.ts
      this.currentSpline.AddPoint(normalizedPoint);

      // Requires resending
      this.lineChanged = true;
    }
  }

  public OnFrameUpdate(): void {
    // Changes to line are done here because of nature of lazy brush, brush is always trying to catch pointer,
    // so where pointer stops moving lazy brush must be updated continuously
    if (this.settings.lazyEnabled && !!this.lastPointer) {

      // Update lazy brush
      this.currentLazyBrush.Update(this.lastPointer);

      // Requires resending
      if (this.currentLazyBrush.HasMoved) {
        this.lineChanged = true;
        this.currentSpline.AddPoint(this.currentLazyBrush.Get());
      }
    }

    if (!this.lineChanged) { return; }
    this.lineChanged = false;

    // Send to others
    this.compiled = new FreeLine(this.currentGUID, this.settings.color, this.settings.width, this.currentSpline.optimized);
    this.manager.ShareCompiledObject(this.compiled, false);

    // Draw predicted line
    this.predictCanvas.clear();
    this.currentSpline.optimized?.length ?
      CardinalSpline.Reproduce(this.predictCanvas, this.settings.color, this.settings.width, this.currentSpline.optimized) :
      console.warn('Missing line (this should not be possible)');
  }

  public OnPointerUp(event: PointerEvent): void {
    // End spline with saving, this method will draw itself
    this.predictCanvas.clear();
    this.manager.SaveCompiledObject(this.compiled);
    this.manager.ShareCompiledObject(this.compiled, true);

    // Cleanup
    this.manager.StopFrameUpdate();
    delete this?.lastPointer;
    delete this?.currentLazyBrush;
    delete this?.currentSpline;
    delete this?.currentGUID;
  }

  public OnPointerCancel(event: PointerEvent): void {
    // End spline and delete result
    this.predictCanvas.clear();
    delete this?.lastPointer;
    delete this?.currentLazyBrush;
    delete this?.currentSpline;
    delete this?.currentGUID;
  }

  public OnSelected(): void {
    this.manager.StopFrameUpdate();
  }
}
