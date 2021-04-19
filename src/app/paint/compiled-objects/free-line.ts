import { Point } from '../protocol/point';
import { Quadrangle } from '../curves/quadrangle';
import { Box, CompiledObject } from './compiled-object';

export class FreeLine implements CompiledObject {
  static readonly DEBUG_IS_SELECTED_BY = false;
  name = 'free-line';
  color: string;
  width: number;
  points: Point[];
  id: string;
  box: Box;
  private readonly advancedBox: Path2D[] = [];

  constructor(id?: string, color?: string, width?: number, points?: Point[], box?: Box) {
    this.id = id;
    this.color = color;
    this.width = width;
    this.points = points;
    this.box = box;
  }

  public getAdvancedBox(): Path2D[] {
    return this.advancedBox;
  }

  public isSelectedBy(ctx: CanvasRenderingContext2D, pointer: Point): boolean {

    if (FreeLine.DEBUG_IS_SELECTED_BY) {
      // Draw box
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.box(this.box);

      for (const point of this.points) {
        ctx.dot(point, 10, 'orange');
      }
    }

    // Light check
    if (!this.box.isPointInside(pointer)) {
      return false;
    }

    // Only light check for dots
    if (this.points.length === 1) {
      return true;
    }

    // Prepare advancedBox
    if (this.advancedBox.length + 1 < this.points.length) {
      for (let i = 1; i < this.points.length; i++) {
        const p1 = this.points[i - 1];
        const p2 = this.points[i];

        this.advancedBox.push(Quadrangle.constructOnPoints(p1, p2, this.width / 2));
      }
    }

    // Hard check
    for (const path of this.advancedBox) {

      const isIn = ctx.isPointInPath(path, pointer.x, pointer.y);

      if (FreeLine.DEBUG_IS_SELECTED_BY) {
        ctx.strokeStyle = isIn ? 'purple' : this.color;
        ctx.lineWidth = 2;
        ctx.stroke(path);
      }

      if (isIn) {
        return true;
      }
    }

    return false;
  }
}
