import { CompiledObject, PaintMode } from './paint-mode';
import { CardinalSpline } from '../cardinal-spline';

export class FreeLine implements CompiledObject {
  name = 'free-line';
  color: string;
  width: number;
  points: Uint32Array[];

  constructor(color?: string, width?: number, points?: Uint32Array[]) {
    this.color = color;
    this.width = width;
    this.points = points;
  }
}

export class FreeLineMode extends PaintMode {
  public currentSpline: CardinalSpline;

  public Reproduce(canvas: CanvasRenderingContext2D, object: FreeLine): void {
    CardinalSpline.Reproduce(canvas, object.color, object.width, object.points);
  }

  public OnPointerDown(event: PointerEvent) {
    const point = new Uint32Array([event.offsetX, event.offsetY]);
    // Start new spline
    this.currentSpline = new CardinalSpline().Apply(this);
    // Add starting point
    this.currentSpline.AddPoint(this.manager.NormalizePoint(point));
    // Enable rendering
    this.manager.StartFrameUpdate();
  }

  public OnPointerUp(event: PointerEvent) {
    // End spline
    const compiled = new FreeLine(this.settings.color, this.settings.width, this.currentSpline.optimized);

    // End spline with saving, this method will draw itself
    this.predictCanvas.clear();
    this.manager.SaveCompiledObject(compiled);

    // Cleanup
    this.manager.StopFrameUpdate();
    delete this?.currentSpline;
  }

  public OnPointerCancel(event: PointerEvent) {
    // End spline and delete result
    this.predictCanvas.clear();
    delete this?.currentSpline;
  }

  public OnPointerMove(event: PointerEvent): void {
    if (!this.currentSpline) { return; }

    // Add point
    const point = new Uint32Array([event.offsetX, event.offsetY]);
    this.currentSpline.AddPoint(this.manager.NormalizePoint(point));
  }

  public OnFrameUpdate() {
    // Draw predicted line
    this.predictCanvas.clear();
    this.currentSpline.optimized?.length ?
      CardinalSpline.Reproduce(this.predictCanvas, this.settings.color, this.settings.width, this.currentSpline.optimized) :
      console.warn('Missing line (this should not be possible)');
  }
}
