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

  /**
   * Creates deep copy
   */
  public Duplicate(): Point {
    return new Point(this.x, this.y);
  }
}
