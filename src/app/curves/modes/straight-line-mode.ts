import {CompiledObject, PaintMode} from './paint-mode';
import {Settings} from '../../settings/settings.interface';

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
  private currentStraightLine: StraightLine;

  public Reproduce(canvas: CanvasRenderingContext2D, object: StraightLine): void {
    canvas.beginPath();
    canvas.moveTo(object.start[0], object.start[1]);
    canvas.lineTo(object.stop[0], object.stop[1]);
    canvas.lineCap = 'round';
    canvas.lineWidth = this.settings.width;
    canvas.strokeStyle = this.settings.color;
    canvas.stroke();
  }

  public OnPointerDown(event: PointerEvent): void {
    const point = new Uint32Array([event.offsetX, event.offsetY]);
    const normalized = this.manager.NormalizePoint(point);
    this.currentStraightLine = new StraightLine(this.settings.color, this.settings.width, normalized, normalized);

    this.manager.StartFrameUpdate();
  }

  public OnPointerUp(event: PointerEvent): void {
    this.manager.StopFrameUpdate();
    this.manager.SaveCompiledObject(this.currentStraightLine);

    delete this.currentStraightLine;
  }

  public OnPointerMove(event: PointerEvent): void {
    const point = new Uint32Array([event.offsetX, event.offsetY]);
    if (!this.currentStraightLine) { return; }

    this.currentStraightLine.stop = this.manager.NormalizePoint(point);
  }

  public OnFrameUpdate(): void {
    this.predictCanvas.clear();
    if (!this.currentStraightLine) { return; }

    this.Reproduce(this.predictCanvas, this.currentStraightLine);
  }
}
