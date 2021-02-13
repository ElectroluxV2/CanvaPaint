import { CompiledObject, PaintMode } from './paint-mode';
import {PublicApi} from '../../paint/public-api';
import {Settings} from '../../settings/settings.interface';

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

  constructor(predictCanvas: CanvasRenderingContext2D, mainCanvas: CanvasRenderingContext2D, settings: Settings) {
    super(predictCanvas, mainCanvas, settings);
    PublicApi.StartFrameUpdate();
  }


  public Reproduce(canvas: CanvasRenderingContext2D, object: CompiledObject): void {

  }

  public OnPointerMove(event: PointerEvent): void {
    const point = new Uint32Array([event.offsetX, event.offsetY]);
    this.lastPointer = PublicApi.NormalizePoint(point);
  }

  public OnFrameUpdate() {
    if (!this.lastPointer) return;
    this.mainCanvas.beginPath();
    this.mainCanvas.arc(
      this.lastPointer[0],
      this.lastPointer[1],
      this.settings.width / Math.PI,
      0,
      2 * Math.PI,
      false
    );
    this.mainCanvas.fillStyle = this.settings.color;
    this.mainCanvas.fill();
  }
}
