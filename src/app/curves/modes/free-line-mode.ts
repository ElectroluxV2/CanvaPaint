import { CompiledObject, PaintMode } from './paint-mode';
import { CardinalSpline } from '../cardinal-spline';
import { LazyBrush } from '../lazy-brush';

export class FreeLine implements CompiledObject {
  name = 'free-line';
  color: string;
  width: number;
  points: Int16Array[];

  constructor(color?: string, width?: number, points?: Int16Array[]) {
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

  public ReproduceObject(canvas: CanvasRenderingContext2D, object: FreeLine): void {
    CardinalSpline.Reproduce(canvas, object.color, object.width, object.points);
  }

  public SerializeObject(object: FreeLine): string {
    // String builder
    const sb = [];

    sb.push(`n:${object.name}`);
    sb.push(`c:${object.color}`);
    sb.push(`w:${object.width}`);

    const ps = [];

    for (const point of object.points) {
      ps.push(`${point[0]};${point[1]}`);
    }

    sb.push(`p:${ps.join('^')}`);

    return sb.join(',');
  }

  public ReadObject(data: string): FreeLine | boolean {

    const freeLine = new FreeLine();
    let i = 0;

    // Read color
    let color = '';
    for (i += 'c:'.length; i < data.length; i++) {
      const c = data[i];

      if (c === ',') { break; }

      color += c;
    }

    // Try color
    const s = new Option().style;
    s.color = color;
    if (s.color === '') {
      console.warn(`"${color}" is not valid color!`);
      return false;
    }

    // Assign
    freeLine.color = color;

    // Read width
    let width = '';
    for (i += ',w:'.length; i < data.length; i++) {
      const c = data[i];

      if (c === ',') { break; }

      width += c;
    }

    // Check width
    if (Number.isNaN(width)) {
      console.warn(`"${width}" is not valid number!`);
      return false;
    }

    // Assign
    freeLine.width = Number.parseInt(width, 10);

    // Read points
    freeLine.points = [];
    for (i += ',p:'.length; i < data.length; i++) {
      const c = data[i];

      if (c === ',') { break; }

      // Single point
      const point = new Int16Array(2);
      let n1 = '', n2 = '';

      // Before ; is n1
      for (; i < data.length; i++) {
        const c1 = data[i];

        if (c1 === ';') { break; }

        n1 += c1;
      }

      // Check n1
      if (Number.isNaN(n1)) {
        console.warn(`"${n1}" is not valid number!`);
        return false;
      }

      // Assign
      point[0] = Number.parseInt(n1, 10);

      // After ; is n2
      for (i += ';'.length; i < data.length; i++) {

        const c1 = data[i];

        if (c1 === '^') { break; }

        n2 += c1;
      }

      // Check n2
      if (Number.isNaN(n2)) {
        console.warn(`"${n2}" is not valid number!`);
        return false;
      }

      // Assign
      point[1] = Number.parseInt(n2, 10);
      freeLine.points.push(point);
    }

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
    // Enable rendering
    this.manager.StartFrameUpdate();
  }

  public OnPointerMove(event: PointerEvent): void {
    if (!this.currentSpline) { return; }

    const point = new Uint32Array([event.offsetX, event.offsetY]);
    const normalizedPoint = this.manager.NormalizePoint(point);

    // When lazy is enabled changes to line should be done on frame update
    if (this.settings.lazyEnabled) {
      // Update lazy brush
      this.currentLazyBrush.Update(normalizedPoint);
    } else {
      // Add point
      this.currentSpline.AddPoint(normalizedPoint);
    }
  }

  public OnFrameUpdate(): void {

    // Changes to line are done here because of nature of lazy brush, brush is always trying to catch pointer,
    // so where pointer stops moving lazy brush must be updated continuously
    if (this.settings.lazyEnabled) {
      this.currentSpline.AddPoint(this.currentLazyBrush.Get());
    }

    // Send to others
    this.compiled = new FreeLine(this.settings.color, this.settings.width, this.currentSpline.optimized);
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
    delete this?.currentLazyBrush;
    delete this?.currentSpline;
  }

  public OnPointerCancel(event: PointerEvent): void {
    // End spline and delete result
    this.predictCanvas.clear();
    delete this?.currentLazyBrush;
    delete this?.currentSpline;
  }

  public OnSelected(): void {
    this.manager.StopFrameUpdate();
  }
}
