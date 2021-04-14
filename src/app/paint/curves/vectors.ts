import { Point } from '../protocol/point';

export class Vector extends Point {

  public static makeVector(p1: Point, p2: Point): Vector {
    return new Vector(p2.x - p1.x, p2.y - p1.y);
  }

  public static perpendicularClockwise(vector: Vector): Vector {
    return new Vector(vector.y, -vector.x);
  }

  public static perpendicularCounterClockwise(vector: Vector): Vector {
    return new Vector(-vector.y, vector.x);
  }

  public static normalize(vector: Vector): Vector {
    const length = this.magnitude(vector, vector);
    return new Vector(vector.x / length, vector.y / length);
  }

  public static multiply(vector: Vector, scalar: number): Vector {
    return new Vector(vector.x * scalar, vector.y * scalar);
  }

  public static add(v1: Vector | Point, v2: Vector | Point): Vector {
    return new Vector(v1.x + v2.x, v1.y + v2.y);
  }

  public static magnitude(v1: Vector, v2: Vector): number {
    return Math.sqrt(v1.x * v2.x + v1.y * v2.y);
  }

  public static reverse(v: Vector) {
    return new Vector(-v.x, -v.y);
  }

  public perpendicularClockwise(): Vector {
    return Vector.perpendicularClockwise(this);
  }

  public perpendicularCounterClockwise(): Vector {
    return Vector.perpendicularCounterClockwise(this);
  }

  public normalize(): Vector {
    return Vector.normalize(this);
  }

  public multiply(scalar: number): Vector {
    return Vector.multiply(this, scalar);
  }

  public add(v2: Vector | Point): Vector {
    return Vector.add(this, v2);
  }

  public magnitude(v2: Vector): number {
    return Vector.magnitude(this, v2);
  }

  public reverse(): Vector {
    return Vector.reverse(this);
  }
}

