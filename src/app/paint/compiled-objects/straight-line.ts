import { CompiledObject } from '../protocol/compiled-object';
import { Point } from '../protocol/point';
import { Settings } from '../../settings/settings.interface';

export class StraightLine implements CompiledObject {
  name = 'straight-line';
  color: string;
  width: number;
  begin: Point;
  end: Point;
  id: string;

  constructor(id?: string, color?: string, width?: number, start?: Point, stop?: Point) {
    this.id = id;
    this.color = color;
    this.width = width;
    this.begin = start ?? new Point(2);
    this.end = stop ?? new Point(2);
  }

  public isSelectedBy(ctx: CanvasRenderingContext2D, pointer: Point): boolean {
    return false;
  }

  public duplicate(): StraightLine {
    return new StraightLine(this.id, this.color, this.width, this.begin, this.end);
  }

  public applySettings(settings: Settings): void {
    this.width = settings.width;
    this.color = settings.color;
  }
}
