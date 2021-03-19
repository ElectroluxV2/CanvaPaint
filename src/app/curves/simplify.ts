import {Point} from '../paint/protocol';

export class Simplify {

  private static GetSqDist(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy;
  }

  private static GetSqSegDist(p: Point, p1: Point, p2: Point): number {

    let x = p1.x;
    let y = p1.y;
    let dx = p2.x - x;
    let dy = p2.y - y;

    if (dx !== 0 || dy !== 0) {

      const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

      if (t > 1) {
        x = p2.x;
        y = p2.y;

      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    dx = p.x - x;
    dy = p.y - y;

    return dx * dx + dy * dy;
  }

  private static SimplifyRadialDist(points: Point[], sqTolerance: number) {

    let prevPoint = points[0];
    const newPoints = [prevPoint];
    let point;

    for (let i = 1, len = points.length; i < len; i++) {
      point = points[i];

      if (this.GetSqDist(point, prevPoint) > sqTolerance) {
        newPoints.push(point);
        prevPoint = point;
      }
    }

    if (prevPoint !== point) { newPoints.push(point); }

    return newPoints;
  }

  private static SimplifyDPStep(points: Point[], first: number, last: number, sqTolerance: number, simplified: Point[]): void {
    let maxSqDist = sqTolerance;
    let index;

    for (let i = first + 1; i < last; i++) {
      const sqDist = this.GetSqSegDist(points[i], points[first], points[last]);

      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (maxSqDist > sqTolerance) {
      if (index - first > 1) { this.SimplifyDPStep(points, first, index, sqTolerance, simplified); }
      simplified.push(points[index]);
      if (last - index > 1) { this.SimplifyDPStep(points, index, last, sqTolerance, simplified); }
    }
  }

  public static SimplifyDouglasPeucker(points: Point[], sqTolerance: number): Point[] {
    const last = points.length - 1;

    const simplified = [points[0]];
    this.SimplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);

    return simplified;
  }

  public static Simplify(points: Point[], tolerance: number, highestQuality = false) {

    if (points.length <= 2) { return points; }

    const sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

    points = highestQuality ? points : this.SimplifyRadialDist(points, sqTolerance);
    points = this.SimplifyDouglasPeucker(points, sqTolerance);

    return points;
  }
}
