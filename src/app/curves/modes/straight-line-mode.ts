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
  private lastPointer: Uint32Array;
  Reproduce(canvas: CanvasRenderingContext2D, object: CompiledObject): void {

  }

  OnSelected() {
    this.manager.StartFrameUpdate();
  }

  OnPointerEnter(event: PointerEvent) {
    this.predictCanvas.canvas.style.cursor = 'none';
  }

  OnPointerLeave(event: PointerEvent) {
    this.predictCanvas.canvas.style.cursor = 'crosshair';
  }

  public OnPointerMove(event: PointerEvent): void {
    const point = new Uint32Array([event.offsetX, event.offsetY]);
    const normalizedPoint = this.manager.NormalizePoint(point);
    this.lastPointer = normalizedPoint;
  }

  public OnFrameUpdate() {
    this.predictCanvas.clear();
    if (!this.lastPointer) {
      return;
    }
    this.predictCanvas.dot(this.lastPointer, 15, 'orange');
  }

  public OnWheel(event: WheelEvent) {
    if (event.deltaX !== 0) {
      this.lastPointer[0] += event.deltaX;
    } else if (event.deltaY) {
      this.lastPointer[1] += event.deltaY;
    }

    this.lastPointer = this.manager.NormalizePoint(this.lastPointer);
  }
}
