import { Point } from '../protocol/point';
import { Quadrangle } from '../curves/quadrangle';
import { CompiledObject } from './compiled-object';
import { Settings } from '../settings.interface';
import { Box } from './box';
import { Protocol } from '../protocol/protocol';
import { PaintMode } from '../modes/paint-mode';

export class StraightLine extends CompiledObject {
  public static DEBUG = false;
  color: string;
  width: number;
  begin: Point;
  end: Point;
  box: Box;
  advancedBox: Path2D;

  constructor(paintMode: PaintMode, id: string = Protocol.generateId(), color?: string, width?: number, start?: Point, stop?: Point, box?: Box) {
    super(paintMode, id);
    this.width = width;
    this.begin = start ?? new Point(2);
    this.end = stop ?? new Point(2);
    this.box = box;
  }

  public isSelectedBy(ctx: CanvasRenderingContext2D, pointer: Point): boolean {
    if (StraightLine.DEBUG) {
      // Draw box
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.box(this.box);
    }

    // Light check
    if (!this.box.isPointInside(pointer)) {
      return false;
    }

    // Prepare advanced box
    if (!this.advancedBox) {
      this.advancedBox = Quadrangle.constructOnPoints(this.begin, this.end, this.width / 2);
    }

    const isIn = ctx.isPointInPath(this.advancedBox, pointer.x, pointer.y);

    if (StraightLine.DEBUG) {
      ctx.strokeStyle = isIn ? 'purple' : this.color;
      ctx.lineWidth = 2;
      ctx.stroke(this.advancedBox);
    }

    // Advanced check
    return isIn;
  }

  public duplicate(): StraightLine {
    return new StraightLine(this.paintMode, this.id, this.color, this.width, this.begin, this.end, this.box);
  }

  public applySettings(settings: Settings): void {
    this.width = settings.width;
    this.color = settings.color;
  }
}
