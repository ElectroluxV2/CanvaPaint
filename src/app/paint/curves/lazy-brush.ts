import { Point } from '../protocol/point';

export class LazyBrush {
  private readonly percentOfDivide: number;
  private pointer: LazyPoint;
  private brush: LazyPoint;
  private angle = 0;
  private distance = 0;
  private movedInternal = false;

  constructor(percentOfDivide: number, startPoint: Point) {
    this.percentOfDivide = percentOfDivide;

    this.pointer = new LazyPoint(startPoint);
    this.brush = new LazyPoint(startPoint);
  }

  /**
   * Updates the pointer point.ts and calculates the new brush point.ts.
   *
   * @param newPointerPoint Array of cords
   * @returns Whether any of the two points changed
   */
  public update(newPointerPoint: Point): boolean {
    this.movedInternal = false;

    this.distance = this.pointer.getDistanceTo(this.brush.get());
    let lazyDistance;

    if (!this.pointer.equalsTo(newPointerPoint)) {
      this.pointer.update(newPointerPoint);
      this.angle = this.pointer.getAngleTo(this.brush.get());

      lazyDistance = this.distance * this.percentOfDivide;
    } else {
      lazyDistance = this.distance * this.percentOfDivide * 4;
    }

    if (lazyDistance < 0.01) {
      return false;
    }

    this.brush.moveByAngle(this.angle, lazyDistance);
    this.movedInternal = true;

    return true;
  }

  public get(): Point {
    return this.brush.get();
  }

  get moved(): boolean {
    return this.movedInternal;
  }

  public forceBrush(lastPointer: Point) {
    this.brush.update(lastPointer);
    this.pointer.update(lastPointer);
    this.movedInternal = true;
  }
}

class LazyPoint {
  private coords: Point = new Point();

  constructor(startPoint: Point) {
    this.coords.x = startPoint.x;
    this.coords.y = startPoint.y;
  }

  public equalsTo(another: Point): boolean {
    return this.coords.x === another.x && this.coords.y === another.y;
  }

  public update(newPointerPoint: Point): void {
    this.coords.x = newPointerPoint.x;
    this.coords.y = newPointerPoint.y;
  }

  public get(): Point {
    return this.coords;
  }

  public getDistanceTo(another: Point): number {
    const diff = this.getDifferenceTo(another);
    return Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2));
  }

  public getAngleTo(another: Point): number {
    const diff = this.getDifferenceTo(another);
    return Math.atan2(diff.y, diff.x);
  }

  public moveByAngle(angle: number, distance: number): void {
    // Rotate the angle based on the browser coordinate system ([0,0] in the top left)
    const angleRotated = angle + (Math.PI / 2);
    this.coords.x = this.coords.x + (Math.sin(angleRotated) * distance);
    this.coords.y = this.coords.y - (Math.cos(angleRotated) * distance);
  }

  private getDifferenceTo(another: Point) {
    return new Point(this.coords.x - another.x, this.coords.y - another.y);
  }
}
