import { SubMode } from '../sub-mode';
import { Point } from '../../protocol/point';
import { StraightLine } from '../../compiled-objects/straight-line';
import { Protocol } from '../../protocol/protocol';
import { Box } from '../../compiled-objects/box';
import { PaintMode } from '../paint-mode';

export class StraightLineModeTouch extends SubMode {
  private currentStraightLine: StraightLine;
  private needRedraw = false;

  constructor(parentMode: PaintMode, private reproduceObject: (canvas: CanvasRenderingContext2D, object: StraightLine, color?: string, width?: number) => void) {
    super(parentMode);
  }

  public onPointerDown(event: PointerEvent): void {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);

    this.currentStraightLine = new StraightLine(this.parentMode, Protocol.generateId());
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
    this.needRedraw = false;

    this.predictCanvasCTX.clear();

    this.currentStraightLine.width = this.paintManager.getSettings<number>('width');
    this.currentStraightLine.color = this.paintManager.getSettings<string>('color');
    this.currentStraightLine.box = Box.fromPoints(this.currentStraightLine.begin, this.currentStraightLine.end);

    this.reproduceObject(this.predictCanvasCTX, this.currentStraightLine);
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
