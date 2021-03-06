import { PaintMode } from '../paint-mode';
import { Point } from '../../protocol/point';
import { PaintManager } from '../../paint-manager';
import { NetworkManager } from '../../network-manager';

export class RemoveObjectMode extends PaintMode {
  readonly name = 'remove-object';
  private lastPointer: Point;
  private running = false;
  private pointerDown = false;

  constructor(predictCanvas: CanvasRenderingContext2D, paintManager: PaintManager, networkManager: NetworkManager) {
    super(predictCanvas, paintManager, networkManager);

    /*this.subModes = new Map<string, SubMode>([
      ['mouse', new RemoveObjectMouse(predictCanvas, paintManager, networkManager)],
      ['pen', new RemoveObjectPen(predictCanvas, paintManager, networkManager)],
      ['touch', new RemoveObjectTouch(predictCanvas, paintManager, networkManager)],
    ]);*/
  }

  public onPointerMove(event: PointerEvent) {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);

    if (this.paintManager.compiledObjectStorage.size === 0) {
      return;
    }

    if (this.lastPointer?.x === normalized.x && this.lastPointer?.y === normalized.y) {
      return;
    }

    this.lastPointer = normalized;

    if (!this.running) {
      this.paintManager.singleFrameUpdate();
    }
  }

  public onFrameUpdate(): void {
    this.running = true;

    // Mark every object as selected
    for (const object of this.paintManager.compiledObjectStorage.values()) {
      const selected = object.isSelectedBy(this.predictCanvas, this.lastPointer);
      this.paintManager.setObjectBit(object, 'selected', selected);

      if (selected && this.pointerDown) {
        this.paintManager.removeCompiledObject(object.id);
        this.networkManager.sendDelete(object.id);
        this.paintManager.redraw();
      }
    }

    // Redraw selected
    this.paintManager.redrawSelected();

    this.running = false;
  }

  public onPointerDown(event: PointerEvent): void {
    this.pointerDown = true;

    if (!this.running) {
      this.paintManager.singleFrameUpdate();
    }
  }

  public onPointerUp(event: PointerEvent): void {
    this.pointerDown = false;

    if (!this.running) {
      this.paintManager.singleFrameUpdate();
    }
  }
}
