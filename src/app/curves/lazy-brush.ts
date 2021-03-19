import {Point} from '../paint/protocol';

export class LazyBrush {

  private readonly percentOfDivide: number;
  private pointer: LazyPoint;
  private brush: LazyPoint;
  private angle = 0;
  private distance = 0;
  private hasMoved = false;

  constructor(percentOfDivide: number, startPoint: Point) {
    this.percentOfDivide = percentOfDivide;

    this.pointer = new LazyPoint(startPoint);
    this.brush = new LazyPoint(startPoint);
  }

  /**
   * Updates the pointer point and calculates the new brush point.
   * @param newPointerPoint Array of cords
   * @returns Whether any of the two points changed
   */
  public Update(newPointerPoint: Point): boolean {
    this.hasMoved = false;

    this.distance = this.pointer.GetDistanceTo(this.brush.Get());
    let lazyDistance;

    if (!this.pointer.EqualsTo(newPointerPoint)) {
      this.pointer.Update(newPointerPoint);
      this.angle = this.pointer.GetAngleTo(this.brush.Get());

      lazyDistance = this.distance * this.percentOfDivide;
    } else {
      lazyDistance = this.distance * this.percentOfDivide * 4;
    }

    if (lazyDistance < 0.01) {
      return false;
    }

    this.brush.MoveByAngle(this.angle, lazyDistance);
    this.hasMoved = true;

    return true;
  }

  public get HasMoved(): boolean {
    return this.hasMoved;
  }

  public Get(): Point {
    return this.brush.Get();
  }

  public ForceBrush(lastPointer: Point) {
    this.brush.Update(lastPointer);
    this.pointer.Update(lastPointer);
    this.hasMoved = true;
  }
}

class LazyPoint {
  private coords: Point = new Point();

  constructor(startPoint: Point) {
    this.coords.x = startPoint.x;
    this.coords.y = startPoint.y;
  }

  public EqualsTo(another: Point): boolean {
    return this.coords.x === another.x && this.coords.y === another.y;
  }

  public Update(newPointerPoint: Point): void {
    this.coords.x = newPointerPoint.x;
    this.coords.y = newPointerPoint.y;
  }

  public Get(): Point {
    return this.coords;
  }

  public GetDistanceTo(another: Point): number {
    const diff = this.GetDifferenceTo(another);
    return Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2));
  }

  public GetAngleTo(another: Point): number {
    const diff = this.GetDifferenceTo(another);
    return Math.atan2(diff.y, diff.x);
  }

  public MoveByAngle(angle: number, distance: number): void {
    // Rotate the angle based on the browser coordinate system ([0,0] in the top left)
    const angleRotated = angle + (Math.PI / 2);
    this.coords.x = this.coords.x + (Math.sin(angleRotated) * distance);
    this.coords.y = this.coords.y - (Math.cos(angleRotated) * distance);
  }

  private GetDifferenceTo(another: Point) {
    return new Point(this.coords.x - another.x, this.coords.y - another.y);
  }
}
