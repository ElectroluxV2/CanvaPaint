import { PaintMode } from './paint-mode';
import { Point } from '../protocol/point';

export class RemoveObjectMode extends PaintMode {
  readonly name = 'remove-object';
  private lastPointer: Point;
  private running = false;
  private pointerDown = false;

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
