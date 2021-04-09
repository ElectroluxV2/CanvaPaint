import { Point } from '../protocol/point';
import { Vector } from './vectors';

export class Quadrangle {
  private p1: Point;
  private p2: Point;
  private p3: Point;
  private p4: Point;
  private sumOfDiagonal: number;

  constructor(p1: Point, p2: Point, p3: Point, p4: Point, sumOfDiagonal: number) {
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    this.sumOfDiagonal = sumOfDiagonal;
  }

  public static constructOnPoints(anchorPoint1: Point, anchorPoint2: Point, scalar: number): Quadrangle {
    const v1 = Vector.makeVector(anchorPoint1, anchorPoint2).perpendicularClockwise().normalize().multiply(scalar);
    const v2 = Vector.makeVector(anchorPoint1, anchorPoint2).perpendicularCounterClockwise().normalize().multiply(scalar);

    const p1 = v1.add(anchorPoint1);
    const p2 = v1.add(anchorPoint1);
    const p3 = v2.add(anchorPoint2);
    const p4 = v2.add(anchorPoint2);

    const sumOfDiagonal = p1.distance(p3) + p2.distance(p4);

    return new Quadrangle(p1, p2, p3, p4, sumOfDiagonal);
  }

  public static isPointerInside(quadrangle: Quadrangle, pointer: Point, tolerance: number): boolean {
    const sumOfNotDiagonal = quadrangle.p1.distance(pointer) + quadrangle.p2.distance(pointer) + quadrangle.p3.distance(pointer) + quadrangle.p4.distance(pointer);
    return Math.abs(quadrangle.sumOfDiagonal - sumOfNotDiagonal) < tolerance;
  }

  public isPointerInside(pointer: Point, tolerance: number): boolean {
    return Quadrangle.isPointerInside(this, pointer, tolerance);
  }
}
