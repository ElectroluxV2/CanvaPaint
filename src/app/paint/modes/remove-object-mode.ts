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
        this.predictCanvas.box(line.getBox());

        // Draw sub boxes
        // console.log(`Suma przekątnych: ${sumOfDiagonal}, suma nie przekątnych: ${sumOfNotDiagonal}, różnica: ${Math.abs(sumOfDiagonal - sumOfNotDiagonal)}`);
        /*this.predictCanvas.dot(p0, 10, 'orange');
        this.predictCanvas.dot(p1, 10, 'orange');

        this.predictCanvas.beginPath();
        this.predictCanvas.moveTo(c0.x, c0.y);
        this.predictCanvas.lineTo(c0Prim.x, c0Prim.y);
        this.predictCanvas.lineTo(c1Prim.x, c1Prim.y);
        this.predictCanvas.lineTo(c1.x, c1.y);
        this.predictCanvas.lineTo(c0.x, c0.y);

        this.predictCanvas.strokeStyle = inside ? 'purple' : 'pink';
        this.predictCanvas.lineWidth = 1;
        this.predictCanvas.stroke();

        this.predictCanvas.beginPath();
        this.predictCanvas.moveTo(cursor.x, cursor.y);
        this.predictCanvas.lineTo(c0.x, c0.y);
        this.predictCanvas.moveTo(cursor.x, cursor.y);
        this.predictCanvas.lineTo(c1.x, c1.y);
        this.predictCanvas.moveTo(cursor.x, cursor.y);
        this.predictCanvas.lineTo(c0Prim.x, c0Prim.y);
        this.predictCanvas.moveTo(cursor.x, cursor.y);
        this.predictCanvas.lineTo(c1Prim.x, c1Prim.y);
        this.predictCanvas.strokeStyle = '#11edff';
        this.predictCanvas.lineWidth = 1;
        this.predictCanvas.stroke();

        this.predictCanvas.beginPath();
        this.predictCanvas.moveTo(c0.x, c0.y);
        this.predictCanvas.lineTo(c1Prim.x, c1Prim.y);
        this.predictCanvas.moveTo(c1.x, c1.y);
        this.predictCanvas.lineTo(c0Prim.x, c0Prim.y);
        this.predictCanvas.strokeStyle = '#dd0000';
        this.predictCanvas.lineWidth = 1;
        this.predictCanvas.stroke();*/
      }
    }

    this.paintManager.redraw();
  }
}
