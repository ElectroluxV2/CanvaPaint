export class LazyBrush {

  private readonly maxDeltaTime: number;
  private pointer: LazyPoint;
  private brush: LazyPoint;
  private angle = 0;
  private distance = 0;
  private hasMoved = false;
  private lastTimeStamp: number;

  constructor(maxDeltaTime: number, startPoint: Float32Array) {
    this.maxDeltaTime = maxDeltaTime;

    this.pointer = new LazyPoint(startPoint);
    this.brush = new LazyPoint(startPoint);

    this.lastTimeStamp = new Date().getTime();
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

    const now = new Date().getTime();
    if (now - this.lastTimeStamp > this.maxDeltaTime) {
      console.log(now - this.lastTimeStamp);
      this.brush.MoveByAngle(this.angle, this.distance);
      this.hasMoved = true;
      this.lastTimeStamp = now;
    }

    return true;
  }

  public get HasMoved(): boolean {
    return this.hasMoved;
  }

  public Get(): Float32Array {
    return this.brush.ToArray();
  }

  public ForceBrush(lastPointer: Float32Array) {
    this.brush.Update(lastPointer);
    this.pointer.Update(lastPointer);
    this.hasMoved = true;
  }
}

class LazyPoint {
  private coords: Float32Array = new Float32Array(2);

  constructor(startPoint: Float32Array) {
    this.coords[0] = startPoint[0];
    this.coords[1] = startPoint[1];
  }

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
    return Math.atan2(diff[1], diff[0]);
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
