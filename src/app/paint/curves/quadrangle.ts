import { Point } from '../protocol/point';
import { Vector } from './vectors';

export class Quadrangle {
  public static constructOnPoints(anchorPoint1: Point, anchorPoint2: Point, scalar: number): Path2D {
    const v1 = Vector.makeVector(anchorPoint1, anchorPoint2).perpendicularClockwise().normalize().multiply(scalar);
    const v2 = Vector.makeVector(anchorPoint1, anchorPoint2).perpendicularCounterClockwise().normalize().multiply(scalar);

    const p1 = v1.add(anchorPoint1);
    const p2 = v2.add(anchorPoint1);
    const p3 = v2.add(anchorPoint2);
    const p4 = v1.add(anchorPoint2);

    const path = new Path2D();
    path.moveTo(p1.x, p1.y);
    path.lineTo(p2.x, p2.y);
    path.lineTo(p3.x, p3.y);
    path.lineTo(p4.x, p4.y);
    path.closePath();

    return path;
  }
}
