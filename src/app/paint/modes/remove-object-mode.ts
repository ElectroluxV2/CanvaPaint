import { PaintMode } from './paint-mode';
import { Point } from '../protocol/point';
import { FreeLine } from './free-line-mode';
import { Vector } from '../curves/vectors';

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

  private next(point: Point): void {
    this.timer = null;
    this.predictCanvas.clear();

    for (const line of this.paintManager.compiledObjectStorage.get('free-line') as FreeLine[]) {
      const box = line.box;

      if (point.x < box.bottomRight.x && point.x > box.topLeft.x && point.y < box.bottomRight.y && point.y > box.topLeft.y) {
        this.predictCanvas.strokeStyle = line.color;
        this.predictCanvas.lineWidth = 1;
        this.predictCanvas.box(box);
        this.drawSubBoxes(line, point);
      }
    }
  }

  private drawSubBoxes(line: FreeLine, cursor: Point): void {
    this.predictCanvas.beginPath();
    for (let i = 1; i < line.points.length; i++) {
      const p0 = line.points[i - 1];
      const p1 = line.points[i];

      // const v0 = this.multiply(this.normalize(this.perpendicularClockwise(this.makeVector(p0, p1))), 5);
      const v0 = Vector.makeVector(p0, p1).perpendicularClockwise().normalize().multiply(5);
      // const v1 = this.multiply(this.normalize(this.perpendicularCounterClockwise(this.makeVector(p0, p1))), 5);
      const v1 = Vector.makeVector(p0, p1).perpendicularCounterClockwise().normalize().multiply(5);

      // const c0Prim = this.addVector(p0, v0);
      const c0Prim = v0.add(p0);
      // const c0 = this.addVector(p0, v1);
      const c0 = v1.add(p0);

      // const c1Prim = this.addVector(p1, v0);
      const c1Prim = v0.add(p1);
      // const c1 = this.addVector(p1, v1);
      const c1 = v1.add(p1);

      // const sumOfDiagonal = this.distance(c0, c1Prim) + this.distance(c1, c0Prim);
      const sumOfDiagonal = c0.distance(c1Prim) + c1.distance(c0Prim);
      // const sumOfNotDiagonal = this.distance(c0, cursor) + this.distance(c1, cursor) + this.distance(c0Prim, cursor) + this.distance(c1Prim, cursor);
      const sumOfNotDiagonal = c0.distance(cursor) + c1.distance(cursor) + c0Prim.distance(cursor) + c1Prim.distance(cursor);

      const inside = Math.abs(sumOfDiagonal - sumOfNotDiagonal) < line.width;

      if (inside) {
        this.predictCanvas.clear();
      }

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

      if (inside) {
        console.log(`Suma przekątnych: ${sumOfDiagonal}, suma nie przekątnych: ${sumOfNotDiagonal}, różnica: ${Math.abs(sumOfDiagonal - sumOfNotDiagonal)}`);
        line.color = 'purple';
        this.paintManager.redraw();
        break;
      } else {
        line.color = 'white';
        this.paintManager.redraw();
      }
    }
  }
}
