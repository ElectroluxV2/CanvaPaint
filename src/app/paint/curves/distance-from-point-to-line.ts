import { Point } from '../protocol/point';

// https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line #Line defined by two points
export const distanceFromPointToLine = (linePoint1: Point, linePoint2: Point, point: Point): number =>
  Math.abs((linePoint2.x - linePoint1.y) * (linePoint1.y - point.y) - (linePoint1.x - point.x) * (linePoint2.y - linePoint1.y))
  /
  Math.sqrt(Math.pow(linePoint2.x - linePoint1.x, 2) + Math.pow(linePoint2.y - linePoint1.y, 2));


export function pDistance(p1: Point, p2: Point, p: Point) {

  const x = p.x;
  const y = p.y;
  const x1 = p1.x;
  const y1 = p1.y;
  const y2 = p2.y;
  const x2 = p2.x;


  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq != 0) //in case of 0 length line
    {
param = dot / len_sq;
}

  let xx; let yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}


export function segmentDistToPoint(segA: Point, segB: Point, p: Point): number {
  const p2: Point = new Point(segB.x - segA.x, segB.y - segA.y);
  const something: number = p2.x * p2.x + p2.y * p2.y;
  let u: number = ((p.x - segA.x) * p2.x + (p.y - segA.y) * p2.y) / something;

  if (u > 1) {
u = 1;
} else if (u < 0) {
u = 0;
}

  const x: number = segA.x + u * p2.x;
  const y: number = segA.y + u * p2.y;

  const dx: number = x - p.x;
  const dy: number = y - p.y;

  const dist: number = Math.sqrt(dx * dx + dy * dy);

  return dist;
}
