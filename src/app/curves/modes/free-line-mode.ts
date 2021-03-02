import { CompiledObject, PaintMode } from './paint-mode';
import { CardinalSpline } from '../cardinal-spline';
import { LazyBrush } from '../lazy-brush';
import { Protocol } from '../../paint/protocol';

export class FreeLine implements CompiledObject {
  name = 'free-line';
  color: string;
  width: number;
  points: Int16Array[];
  id: string;

  constructor(id: string, color?: string, width?: number, points?: Int16Array[]) {
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
  private lastPointer: Uint32Array;

  public ReproduceObject(canvas: CanvasRenderingContext2D, object: FreeLine): void {
    CardinalSpline.Reproduce(canvas, object.color, object.width, object.points);
  }

  public SerializeObject(object: FreeLine): string {
    // String builder
    const sb = [];

    sb.push(`n:${object.name}`);
    sb.push(`i:${object.id}`);
    sb.push(`c:${object.color}`);
    sb.push(`w:${object.width}`);

    const ps = [];

    for (const point of object.points) {
      ps.push(`${point[0]};${point[1]}`);
    }

    sb.push(`p:${ps.join('^')}`);

    return sb.join(',');
  }

  public ReadObject(data: string, currentPosition = { value: 0 }): FreeLine | boolean {
    const freeLine = new FreeLine(Protocol.ReadString(data, 'i', currentPosition));

    // Read color
    freeLine.color = Protocol.ReadString(data, 'c', currentPosition);
    // Read width
    freeLine.width = Protocol.ReadNumber(data, 'w', currentPosition);
    // Read points
    freeLine.points = Protocol.ReadArray<Array<Int16Array>, Int16Array>(Array, Int16Array, Protocol.ReadPoint, data, 'p', currentPosition);

    return freeLine;
  }

  public OnPointerDown(event: PointerEvent): void {
    const point = new Uint32Array([event.offsetX, event.offsetY]);
    const normalizedPoint = this.manager.NormalizePoint(point);
    // Start new spline
    this.currentSpline = new CardinalSpline().Apply(this);
    // Add starting point
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

    const point = new Uint32Array([event.offsetX, event.offsetY]);
    const normalizedPoint = this.manager.NormalizePoint(point);

    // When lazy is enabled changes to line should be done on frame update
    if (this.settings.lazyEnabled) {
      // Save for lazy update
      this.lastPointer = normalizedPoint;
    } else {
      // Add point
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
