import { PaintMode } from './paint-mode';
import { Point } from '../protocol/point';
import { FreeLine } from './free-line-mode';

export class RemoveObjectMode extends PaintMode {
  readonly name = 'remove-object';
  private timer = null;

  public onPointerMove(event: PointerEvent) {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);

    if (this.paintManager.compiledObjectStorage.get('free-line').length < 1) {
      return;
    }

    if (this.timer !== null) {
      return;
    }

    this.timer = setTimeout(this.next.bind(this), 10, normalized);
  }

  private next(pointer: Point): void {
    this.timer = null;
    this.predictCanvas.clear();

    for (const line of this.paintManager.compiledObjectStorage.get('free-line') as FreeLine[]) {

      if (line.isSelectedBy(pointer)) {
        line.color = 'purple';
      } else {
        line.color = 'grey';
      }

      if (FreeLine.DEBUG_IS_SELECTED_BY) {
        // Draw box
        this.predictCanvas.strokeStyle = line.color;
        this.predictCanvas.lineWidth = 1;

        if (!line.getBox().isPointInside(pointer)) {
          continue;
        }

        this.predictCanvas.box(line.getBox());

        for (const point of line.points) {
          this.predictCanvas.dot(point, 10, 'orange');
        }

        // Draw sub boxes
        for (const quadrangle of line.getAdvancedBox()) {
          if (quadrangle.isPointerInside(pointer, line.width)) {
            const sumOfNotDiagonal = quadrangle.sumOfNotDiagonal(pointer);
            console.info(`sumOfDiagonal: ${quadrangle.sumOfDiagonal}, sumOfNotDiagonal: ${sumOfNotDiagonal}, difference: ${Math.abs(quadrangle.sumOfDiagonal - sumOfNotDiagonal)}`);
          }

          this.predictCanvas.beginPath();
          this.predictCanvas.moveTo(quadrangle.p1.x, quadrangle.p1.y);
          this.predictCanvas.lineTo(quadrangle.p2.x, quadrangle.p2.y);
          this.predictCanvas.lineTo(quadrangle.p3.x, quadrangle.p3.y);
          this.predictCanvas.lineTo(quadrangle.p4.x, quadrangle.p4.y);
          this.predictCanvas.lineTo(quadrangle.p1.x, quadrangle.p1.y);

          this.predictCanvas.strokeStyle = quadrangle.isPointerInside(pointer, line.width) ? 'purple' : 'pink';
          this.predictCanvas.lineWidth = 1;
          this.predictCanvas.stroke();

          this.predictCanvas.beginPath();
          this.predictCanvas.moveTo(pointer.x, pointer.y);
          this.predictCanvas.lineTo(quadrangle.p1.x, quadrangle.p1.y);
          this.predictCanvas.moveTo(pointer.x, pointer.y);
          this.predictCanvas.lineTo(quadrangle.p2.x, quadrangle.p2.y);
          this.predictCanvas.moveTo(pointer.x, pointer.y);
          this.predictCanvas.lineTo(quadrangle.p3.x, quadrangle.p3.y);
          this.predictCanvas.moveTo(pointer.x, pointer.y);
          this.predictCanvas.lineTo(quadrangle.p4.x, quadrangle.p4.y);
          this.predictCanvas.strokeStyle = '#11edff';
          this.predictCanvas.lineWidth = 1;
          this.predictCanvas.stroke();

          this.predictCanvas.beginPath();
          this.predictCanvas.moveTo(quadrangle.p1.x, quadrangle.p1.y);
          this.predictCanvas.lineTo(quadrangle.p3.x, quadrangle.p3.y);
          this.predictCanvas.moveTo(quadrangle.p2.x, quadrangle.p2.y);
          this.predictCanvas.lineTo(quadrangle.p4.x, quadrangle.p4.y);
          this.predictCanvas.strokeStyle = '#dd0000';
          this.predictCanvas.lineWidth = 1;
          this.predictCanvas.stroke();
        }
      }
    }

    // Apply line color change
    this.paintManager.redraw();
  }
}
