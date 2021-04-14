import { PaintMode } from './paint-mode';
import { Point } from '../protocol/point';
import { FreeLine } from './free-line-mode';

export class RemoveObjectMode extends PaintMode {
  readonly name = 'remove-object';
  private lastPointer: Point;
  private running = false;
  private currentlySelectedIds: string[] = [];



  public onPointerMove(event: PointerEvent) {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);

    if (this.paintManager.compiledObjectStorage.get('free-line').length < 1) {
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
    this.predictCanvas.clear();

    for (const line of this.paintManager.compiledObjectStorage.get('free-line') as FreeLine[]) {

      if (line.isSelectedBy(this.predictCanvas, this.lastPointer)) {
        this.currentlySelectedIds.push(line.id);
        // this.paintManager.compiledObjectStorage.set('free-line', this.paintManager.compiledObjectStorage.get('free-line').filter(target => target.id !== line.id));
        line.color = 'purple';
      } else {
        this.currentlySelectedIds = this.currentlySelectedIds.filter(id => id !== line.id);
        line.color = 'white';
      }

      if (FreeLine.DEBUG_IS_SELECTED_BY) {
        // Draw box
        this.predictCanvas.strokeStyle = line.color;
        this.predictCanvas.lineWidth = 1;

        if (!line.getBox().isPointInside(this.lastPointer)) {
          continue;
        }

        this.predictCanvas.box(line.getBox());

        for (const point of line.points) {
          this.predictCanvas.dot(point, 10, 'orange');
        }

        // Draw sub boxes
        for (const path of line.getAdvancedBox()) {

          this.predictCanvas.strokeStyle = this.predictCanvas.isPointInPath(path, this.lastPointer.x, this.lastPointer.y) ? 'purple' : 'pink';
          this.predictCanvas.lineWidth = 3;
          this.predictCanvas.stroke(path);

          /*this.predictCanvas.beginPath();
          this.predictCanvas.moveTo(this.lastPointer.x, this.lastPointer.y);
          this.predictCanvas.lineTo(quadrangle.p1.x, quadrangle.p1.y);
          this.predictCanvas.moveTo(this.lastPointer.x, this.lastPointer.y);
          this.predictCanvas.lineTo(quadrangle.p2.x, quadrangle.p2.y);
          this.predictCanvas.moveTo(this.lastPointer.x, this.lastPointer.y);
          this.predictCanvas.lineTo(quadrangle.p3.x, quadrangle.p3.y);
          this.predictCanvas.moveTo(this.lastPointer.x, this.lastPointer.y);
          this.predictCanvas.lineTo(quadrangle.p4.x, quadrangle.p4.y);
          this.predictCanvas.strokeStyle = '#11edff';
          this.predictCanvas.lineWidth = 1;
          this.predictCanvas.stroke();*/
        }
      }
    }

    // Apply line color change
    // TODO: maybe another layer would be better
    this.paintManager.redraw();
    this.running = false;
  }

  public onPointerDown(event: PointerEvent) {
    while (this.currentlySelectedIds.length) {
      const id = this.currentlySelectedIds.shift();
      this.paintManager.removeCompiledObject(id);
    }

    this.paintManager.redraw();
  }

}
