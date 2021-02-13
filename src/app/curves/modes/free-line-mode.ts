import { CompiledObject, PaintMode } from './paint-mode';
import { Settings } from '../../settings/settings.interface';
import { PaintManager } from '../../paint/paint';

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
  private lastPointer: Uint32Array;

  constructor(predictCanvas: CanvasRenderingContext2D, mainCanvas: CanvasRenderingContext2D, manager: PaintManager, settings: Settings) {
    super(predictCanvas, mainCanvas, manager, settings);
    manager.StartFrameUpdate();
  }

  public Reproduce(canvas: CanvasRenderingContext2D, object: CompiledObject): void {

  }

  public OnPointerMove(event: PointerEvent): void {
    const point = new Uint32Array([event.offsetX, event.offsetY]);
    this.lastPointer = this.mainCanvas.normalizePoint(point);
  }

  public OnFrameUpdate() {
    if (!this.lastPointer) { return; }
    this.mainCanvas.dot(this.lastPointer, this.settings.width * 2.5, this.settings.color);
  }
}
