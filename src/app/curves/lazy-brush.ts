export class LazyBrush {

  private readonly percentOfDivide: number;
  private pointer: LazyPoint;
  private brush: LazyPoint;
  private angle = 0;
  private distance = 0;
  private hasMoved = false;

  constructor(percentOfDivide: number, startPoint: Uint32Array) {
    this.percentOfDivide = percentOfDivide;

    this.pointer = new LazyPoint(startPoint);
    this.brush = new LazyPoint(startPoint);
  }

  /**
   * Updates the pointer point and calculates the new brush point.
   * @param newPointerPoint Array of cords
   * @returns Whether any of the two points changed
   */
  public Update(newPointerPoint: Uint32Array): boolean {
    this.hasMoved = false;

    this.distance = this.pointer.GetDistanceTo(this.brush.ToArray());
    let lazyDistance;

    if (!this.pointer.EqualsTo(newPointerPoint)) {
      this.pointer.Update(newPointerPoint);
      this.angle = this.pointer.GetAngleTo(this.brush.ToArray());

      lazyDistance = this.distance * this.percentOfDivide;
    } else {
      lazyDistance = this.distance * this.percentOfDivide * 4;
    }

    this.brush.MoveByAngle(this.angle, lazyDistance);
    this.hasMoved = true;

    return true;
  }

  public get HasMoved(): boolean {
    return this.hasMoved;
  }

  public Get(): Uint32Array {
    return this.brush.ToArray();
  }

  public ForceBrush(lastPointer: Uint32Array) {
    this.brush.Update(lastPointer);
    this.pointer.Update(lastPointer);
    this.hasMoved = true;
  }
}

class LazyPoint {
  private coords: Uint32Array = new Uint32Array(2);

  constructor(startPoint: Uint32Array) {
    this.coords[0] = startPoint[0];
    this.coords[1] = startPoint[1];
  }

  public EqualsTo(another: Uint32Array): boolean {
    return this.coords[0] === another[0] && this.coords[1] === another[1];
  }

  public Update(newPointerPoint: Uint32Array): void {
    this.coords[0] = newPointerPoint[0];
    this.coords[1] = newPointerPoint[1];
  }

  public GetDistanceTo(another: Uint32Array): number {
    const diff = this.GetDifferenceTo(another);
    return Math.sqrt(Math.pow(diff[0], 2) + Math.pow(diff[1], 2));
  }

  public GetAngleTo(another: Uint32Array): number {
    const diff = this.GetDifferenceTo(another);
    return Math.atan2(diff[1], diff[0]);
  }

  public MoveByAngle(angle: number, distance: number): void {
    // Rotate the angle based on the browser coordinate system ([0,0] in the top left)
    const angleRotated = angle + (Math.PI / 2);
    this.coords[0] = this.coords[0] + (Math.sin(angleRotated) * distance);
    this.coords[1] = this.coords[1] - (Math.cos(angleRotated) * distance);
  }

  public ToArray(): Uint32Array {
    return this.coords;
  }

  private GetDifferenceTo(another: Uint32Array) {
    return new Uint32Array([this.coords[0] - another[0], this.coords[1] - another[1]]);
  }
}
