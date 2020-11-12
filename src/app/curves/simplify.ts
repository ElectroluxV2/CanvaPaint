export class Simplify {

  private static GetSqDist(p1: Float32Array, p2: Float32Array): number {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return dx * dx + dy * dy;
  }

  private static GetSqSegDist(p: Float32Array, p1: Float32Array, p2: Float32Array): number {

    let x = p1[0];
    let y = p1[1];
    let dx = p2[0] - x;
    let dy = p2[1] - y;

    if (dx !== 0 || dy !== 0) {

      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

      if (t > 1) {
        x = p2[0];
        y = p2[1];

      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    dx = p[0] - x;
    dy = p[1] - y;

    return dx * dx + dy * dy;
  }

  private static SimplifyRadialDist(points: Float32Array[], sqTolerance: number) {

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

  private static SimplifyDPStep(points: Float32Array[], first: number, last: number, sqTolerance: number, simplified: Float32Array[]): void {
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

  public static SimplifyDouglasPeucker(points: Float32Array[], sqTolerance: number): Float32Array[] {
    const last = points.length - 1;

    const simplified = [points[0]];
    this.SimplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);

    return simplified;
  }

  public static Simplify(points: Float32Array[], tolerance: number, highestQuality = false) {

    if (points.length <= 2) { return points; }

    const sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

    points = highestQuality ? points : this.SimplifyRadialDist(points, sqTolerance);
    points = this.SimplifyDouglasPeucker(points, sqTolerance);

    return points;
  }
}