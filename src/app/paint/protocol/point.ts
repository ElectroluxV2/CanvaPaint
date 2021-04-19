/**
 * Represents single point.ts in canvas
 */

export class Point {
  x: number; // Float
  y: number; // Float

  constructor(x?: number, y?: number) {
    this.x = x ?? 0;
    this.y = y ?? 0;
  }

  public static distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  public static equals(p1: Point, p2: Point): boolean {
    return Math.abs(p1.x - p2.x) < Number.EPSILON && Math.abs(p1.y - p2.y) < Number.EPSILON;
  }

  /**
   * Creates deep copy
   */
  public duplicate(): Point {
    return new Point(this.x, this.y);
  }

  public distance(p2: Point): number {
    return Point.distance(this, p2);
  }

  public equals(other: Point): boolean {
    return Point.equals(this, other);
  }
}
