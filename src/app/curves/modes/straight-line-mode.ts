import { CompiledObject, PaintMode } from './paint-mode';
import { Settings } from '../../settings/settings.interface';

export class StraightLine implements CompiledObject {
  name = 'straight-line';
  color: string;
  width: number;
  start: Uint32Array;
  stop: Uint32Array;

  constructor(color: string, width: number, start?: Uint32Array, stop?: Uint32Array) {
    this.color = color;
    this.width = width;
    this.start = start ?? new Uint32Array(2);
    this.stop = stop ?? new Uint32Array(2);
  }

  public Duplicate(): StraightLine {
    return new StraightLine(this.color, this.width, this.start, this.stop);
  }

  public ApplySettings(settings: Settings): void {
    this.width = settings.width;
    this.color = settings.color;
  }

}

export class StraightLineMode extends PaintMode {
  Reproduce(canvas: CanvasRenderingContext2D, object: CompiledObject): void {

  }

  OnPointerMove(event: PointerEvent) {
    console.log(event.pointerType);
  }

}
