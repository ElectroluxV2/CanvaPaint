import { CompiledObject, PaintMode } from './paint-mode';

export class FreeLine implements CompiledObject {
  name = 'free-line';
  color: string;
  width: number;
  points: Uint32Array[];

  constructor(color: string, width: number, points: Uint32Array[]) {
    this.color = color;
    this.width = width;
    this.points = points;
  }
}

export class FreeLineMode extends PaintMode {
  Reproduce(canvas: CanvasRenderingContext2D, object: CompiledObject): void {

  }
}
