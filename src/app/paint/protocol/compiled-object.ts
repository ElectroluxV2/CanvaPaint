import { Point } from './point';

export class Box {
  public readonly topLeft: Point;
  public readonly bottomRight: Point;

  public constructor(topLeft: Point, bootomRight: Point) {
    this.topLeft = topLeft;
    this.bottomRight = bootomRight;
  }

  public static isPointInside(box: Box, point: Point): boolean {
    return point.x < box.bottomRight.x && point.x > box.topLeft.x && point.y < box.bottomRight.y && point.y > box.topLeft.y;
  }

  public static fromPoints(p1: Point, p2: Point) {
    if (p1.x > p2.x && p1.y < p2.y) {
      return new Box(new Point(p2.x, p1.y), new Point(p1.x, p2.y));
    } else if (p1.x < p2.x && p1.y < p2.y) {
      return new Box(p1, p2);
    } else if (p1.x > p2.x && p1.y > p2.y) {
      return new Box(p2, p1);
    } else {
      return new Box(new Point(p1.x, p2.y), new Point(p2.x, p1.y));
    }
  }

  public isPointInside(point: Point): boolean {
    return Box.isPointInside(this, point);
  }
}

/**
 * Represents object that contains minimalistic data on how to draw it onto canvas
 */
export interface CompiledObject {
  /**
   * Has to be unique, used for storing in map as key, must match mode name
   * must return only 1 match with regex /([A-z]+([A-z]|-|[0-9])+)/g
   */
  name: string;
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Color
   */
  color: string;

  /**
   * Should return true if pointer is inside object
   *
   * @param ctx canvas context
   * @param pointer point in canvas
   */
  isSelectedBy(ctx: CanvasRenderingContext2D, pointer: Point): boolean;
}
