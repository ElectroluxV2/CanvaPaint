import { SubMode } from '../sub-mode';
import { PaintManager } from '../../paint-manager';
import { NetworkManager } from '../../network-manager';
import { Point } from '../../protocol/point';
import { StraightLine } from '../../compiled-objects/straight-line';
import { Protocol } from '../../protocol/protocol';
import { Box } from '../../protocol/compiled-object';

export class StraightLineModeTouch implements SubMode {
  private currentStraightLine: StraightLine;
  private needRedraw = false;

  constructor(private predictCanvas: CanvasRenderingContext2D, private paintManager: PaintManager, private networkManager: NetworkManager, private reproduceObject: (canvas: CanvasRenderingContext2D, object: StraightLine, color?: string, width?: number) => void) { }

  public onPointerDown(event: PointerEvent): void {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);

    this.currentStraightLine = new StraightLine(Protocol.generateId());
    this.currentStraightLine.begin = normalized;

    this.paintManager.startFrameUpdate();
  }

  public onPointerMove(event: PointerEvent): void {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);

    this.needRedraw = !this.currentStraightLine.end.equals(normalized);
    this.currentStraightLine.end = normalized;
  }

  public onFrameUpdate(): void {

    if (!this.needRedraw) { return; }
    console.log(this.needRedraw);

    this.predictCanvas.clear();

    this.currentStraightLine.width = this.paintManager.getSettings<number>('width');
    this.currentStraightLine.color = this.paintManager.getSettings<string>('color');
    this.currentStraightLine.box = Box.fromPoints(this.currentStraightLine.begin, this.currentStraightLine.end);

    this.reproduceObject(this.predictCanvas, this.currentStraightLine);
    this.networkManager.shareCompiledObject(this.currentStraightLine, false);
  }

  public onPointerUp(event: PointerEvent): void {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);
    this.currentStraightLine.end = normalized;

    this.currentStraightLine.width = this.paintManager.getSettings<number>('width');
    this.currentStraightLine.color = this.paintManager.getSettings<string>('color');
    this.currentStraightLine.box = Box.fromPoints(this.currentStraightLine.begin, this.currentStraightLine.end);

    this.paintManager.saveCompiledObject(this.currentStraightLine);
    this.networkManager.shareCompiledObject(this.currentStraightLine, true);
    this.paintManager.stopFrameUpdate();
  }
}
