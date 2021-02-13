import { Simplify } from './simplify';
import { FreeLineMode } from './modes/free-line-mode';

export class CardinalSpline {
  private predict: CanvasRenderingContext2D;
  private tolerance: number;
  private width: number;
  private color: string;

  private points: Uint32Array[] = [];
  public optimized: Uint32Array[] = [];

  constructor(); // Make apply possible
  constructor(predict?: CanvasRenderingContext2D, tolerance = 1, width = 5, color = 'green') {
    this.predict = predict;
    this.tolerance = tolerance;
    this.width = width;
    this.color = color;
  }

  static QuadraticCurve(context: CanvasRenderingContext2D, points: Uint32Array[], color: string, width: number, drawDotOnly: boolean = false): void {
    if (drawDotOnly) {
      context.beginPath();
      context.arc(points[0][0], points[0][1], width * 2 / Math.PI, 0, 2 * Math.PI, false);
      context.fillStyle = color;
      context.fill();
      return;
    }

    // Points must be optimized at this point
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length - 2; i ++) {
      const xc = (points[i][0] + points[i + 1][0]) / 2;
      const yc = (points[i][1] + points[i + 1][1]) / 2;

      context.quadraticCurveTo(points[i][0], points[i][1], xc, yc);
    }

    // Curve through the last two points
    context.quadraticCurveTo(
      points[points.length - 2][0],
      points[points.length - 2][1],
      points[points.length - 1][0],
      points[points.length - 1][1]
    );

    context.strokeStyle = color;
    context.lineWidth = width;
    context.stroke();
  }

  public static Reproduce(canvas: CanvasRenderingContext2D, color: string, width: number, points: Uint32Array[]): void {
    canvas.strokeStyle = color;
    canvas.lineWidth = width;
    CardinalSpline.QuadraticCurve(canvas, points, color, width, points?.length < 2);
  }

  /**
   * Alternative to constructor
   */
  public Apply(mode: FreeLineMode): CardinalSpline {
    this.predict = mode.predictCanvas;
    this.tolerance = mode.settings.tolerance;
    this.width = mode.settings.width;
    this.color = mode.settings.color;
    return this;
  }

  public set Color(value: string) {
    this.color = value;
  }

  public set Width(value: number) {
    this.width = value;
  }

  public set Tolerance(value: number) {
    this.tolerance = value;
  }

  public get IsEmpty(): boolean {
    return this.points.length === 0;
  }

  public AddPoint(point: Uint32Array): void {
    // Same point prevention
    if (this.points.length) {
      const toCheck = this.points[this.points.length - 1];
      if (point[0] === toCheck[0] && point[1] === toCheck[1]) {
        return;
      }
    }

    // Deep copy
    this.points.push(new Uint32Array([...point]));
    this.optimized = Simplify.Simplify(this.points, this.tolerance);

    // TODO: better way of doing it
    // At some point there is no point in optimizing such a big line, so split it
    /*if (this.optimized.length > 25) {
      // TODO: smooth blend point

      // Copy last point
      const last = this.points[this.points.length - 1];
      this.points.slice(0, this.points.length - 1);

      // Split line
      this.optimized = Simplify.Simplify(this.points, this.tolerance);
      toReturn.push(...this.Finish());

      this.points = [last];
      this.optimized = [];
    }*/
  }
}
