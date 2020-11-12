export class LazyBrush {

  private readonly radius: number;
  private pointer: LazyPoint;
  private brush: LazyPoint;
  private angle: number;
  private distance: number;
  private hasMoved: boolean;

  constructor(radius: number) {
    this.radius = radius;

    this.pointer = new LazyPoint();
    this.brush = new LazyPoint();

    this.angle = 0;
    this.distance = 0;
    this.hasMoved = false;
  }

  /**
   * Updates the pointer point and calculates the new brush point.
   * @param newPointerPoint Array of cords
   * @returns Whether any of the two points changed
   */
  public Update(newPointerPoint: Float32Array): boolean {
    this.hasMoved = false;

    if (this.pointer.EqualsTo(newPointerPoint)) {
      return false;
    }

    this.pointer.Update(newPointerPoint);

    this.distance = this.pointer.GetDistanceTo(this.brush.ToArray());
    this.angle = this.pointer.GetAngleTo(this.brush.ToArray());

    if (this.distance > this.radius) {
      this.brush.MoveByAngle(this.angle, this.distance - this.radius);
      this.hasMoved = true;
    }

    return true;
  }

  public Get(): Float32Array {
    return this.brush.ToArray();
  }
}

class LazyPoint {
  private coords: Float32Array = new Float32Array(2);

  public EqualsTo(another: Float32Array): boolean {
    return this.coords[0] === another[0] && this.coords[1] === another[1];
  }

  public Update(newPointerPoint: Float32Array): void {
    this.coords[0] = newPointerPoint[0];
    this.coords[1] = newPointerPoint[1];
  }

  public GetDistanceTo(another: Float32Array): number {
    const diff = this.GetDifferenceTo(another);
    return Math.sqrt(Math.pow(diff[0], 2) + Math.pow(diff[1], 2));
  }

  public GetAngleTo(another: Float32Array): number {
    const diff = this.GetDifferenceTo(another);
    return Math.atan2(diff[0], diff[1]);
  }

  public MoveByAngle(angle: number, distance: number): void {
    // Rotate the angle based on the browser coordinate system ([0,0] in the top left)
    const angleRotated = angle + (Math.PI / 2);
    this.coords[0] = this.coords[0] + (Math.sin(angleRotated) * distance);
    this.coords[1] = this.coords[1] - (Math.cos(angleRotated) * distance);
  }

  public ToArray(): Float32Array {
    return this.coords;
  }

  private GetDifferenceTo(another: Float32Array) {
    return new Float32Array([this.coords[0] - another[0], this.coords[1] - another[1]]);
  }
}
