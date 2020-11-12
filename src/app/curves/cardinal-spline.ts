import { Simplify } from './simplify';

export class CardinalSpline {
  private readonly main: CanvasRenderingContext2D;
  private readonly predict: CanvasRenderingContext2D;
  private readonly tolerance: number;
  private readonly width: number;
  private readonly color: string;

  private points: Float32Array[] = [];
  private optimized: Float32Array[] = [];

  constructor(main: CanvasRenderingContext2D, predict: CanvasRenderingContext2D, tolerance = 1, width = 5, color = 'green') {
    this.main = main;
    this.predict = predict;
    this.tolerance = tolerance;
    this.width = width;
    this.color = color;
  }

  private static QuadraticCurve(context: CanvasRenderingContext2D, points: Float32Array[]): void {
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

    context.stroke();
  }

  public AddPoint(point: Float32Array): void {

    // Same point redraw prevention
    const prev = this.points[this.points.length - 1];
    if (!!prev && prev[0] === point[0] && prev[1] === point[1]) { return; }

    this.points.push(point);

    // At some point there is no point in optimizing such a big line, so split it
    if (this.optimized.length > 25) {
      // TODO: smooth blend point

      // Copy last point
      const last = this.points[this.points.length - 1];
      this.points.slice(0, this.points.length - 1);

      // Split line
      this.optimized = Simplify.Simplify(this.points, this.tolerance);
      this.Finish();

      this.points = [last];
      this.optimized = [];
    }

    if (this.points.length < 2) { return; }

    this.optimized = Simplify.Simplify(this.points, this.tolerance);
    this.predict.strokeStyle = this.color;
    this.predict.lineWidth = this.width;

    this.predict.clear();
    CardinalSpline.QuadraticCurve(this.predict, this.optimized);
  }

  public Finish(): void {
    this.main.strokeStyle = this.color;
    this.main.lineWidth = this.width;

    // Clear predict
    this.predict.clear();

    // Copy single point in order to make simple dot possible to draw
    if (this.points.length === 1) { CardinalSpline.QuadraticCurve(this.main, [...this.points, ...this.points, ...this.points]); }
    else { CardinalSpline.QuadraticCurve(this.main, this.optimized); }

    delete this.points;
    delete this.optimized;
  }
}
