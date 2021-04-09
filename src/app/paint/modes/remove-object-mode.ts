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

  private next(point: Point): void {
    this.timer = null;
    this.predictCanvas.clear();

    for (const line of this.paintManager.compiledObjectStorage.get('free-line') as FreeLine[]) {
      const box = line.box;

      if (point.x < box.p1.x && point.x > box.p0.x && point.y < box.p1.y && point.y > box.p0.y) {
        this.predictCanvas.strokeStyle = line.color;
        this.predictCanvas.lineWidth = 1;
        this.predictCanvas.box(box);
        this.drawSubBoxes(line, point);
      }
    }
  }

  private makeVector(p0: Point, p1: Point): Point {
    return new Point(p1.x - p0.x,  p1.y - p0.y);
  }

  private perpendicularClockwise(point: Point): Point {
    return new Point(point.y, -point.x);
  }

  private perpendicularCounterClockwise(point: Point): Point {
    return new Point(-point.y, point.x);
  }

  private normalize(point: Point): Point {
    const length = this.length(point, point);
    return new Point(point.x / length, point.y / length);
  }

  private multiply(point: Point, scalar: number): Point {
    return new Point(point.x * scalar, point.y * scalar);
  }

  private addVector(point: Point, vector: Point): Point {
    return new Point(point.x + vector.x, point.y + vector.y);
  }

  private length(p0: Point, p1: Point): number {
    return Math.sqrt(p0.x * p1.x + p0.y * p1.y);
  }

  private distance(p0: Point, p1: Point): number {
    return Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
  }

  private drawSubBoxes(line: FreeLine, cursor: Point): void {
    this.predictCanvas.beginPath();
    for (let i = 1; i < line.points.length; i++) {
      const p0 = line.points[i - 1];
      const p1 = line.points[i];

      const v0 = this.multiply(this.normalize(this.perpendicularClockwise(this.makeVector(p0, p1))), 5);
      const v1 = this.multiply(this.normalize(this.perpendicularCounterClockwise(this.makeVector(p0, p1))), 5);

      const c0Prim = this.addVector(p0, v0);
      const c0 = this.addVector(p0, v1);

      const c1Prim = this.addVector(p1, v0);
      const c1 = this.addVector(p1, v1);

      const sumOfDiagonal = this.distance(c0, c1Prim) + this.distance(c1, c0Prim);
      const sumOfNotDiagonal = this.distance(c0, cursor) + this.distance(c1, cursor) + this.distance(c0Prim, cursor) + this.distance(c1Prim, cursor);

      const inside = Math.abs(sumOfDiagonal - sumOfNotDiagonal) < 10;


      if (inside) {
        this.predictCanvas.clear();
      }

      this.predictCanvas.dot(p0, 10, 'orange');
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
      this.predictCanvas.stroke();

      if (inside) {
        console.log(`Suma przekątnych: ${sumOfDiagonal}, suma nie przekątnych: ${sumOfNotDiagonal}, różnica: ${Math.abs(sumOfDiagonal - sumOfNotDiagonal)}`);
        line.color = 'purple';
        this.paintManager.redraw();
        break;
      } else {
        line.color = 'white';
        this.paintManager.redraw();
      }





      /*this.predictCanvas.dot(c0Prim, 10, 'purple');
      this.predictCanvas.dot(c0, 10, 'purple');
      this.predictCanvas.dot(c1Prim, 10, 'purple');
      this.predictCanvas.dot(c1, 10, 'purple');*/

      /*const box = {
        p0,
        p1
      };

      this.predictCanvas.strokeStyle = 'purple';

      this.predictCanvas.moveTo(p0.x, p0.y);
      this.predictCanvas.lineTo(p1.x, p1.y);
      this.predictCanvas.stroke();

      this.predictCanvas.strokeStyle = line.color;

      let isInside = false;

      if (p0.x < p1.x && p0.y < p1.y) {
        // p0 is top left, p1 is bottom right
        if (cursor.x >= p0.x && cursor.x <= p1.x && cursor.y >= p0.y && cursor.y <= p1.y) {
          isInside = true;
        }
      } else if (p0.x < p1.x && p0.y > p1.y) {
        // p0 bottom left, p1 is top right
        if (cursor.x <= p1.x && cursor.x >= p0.x && cursor.y >= p1.y && cursor.y <= p0.y) {
          isInside = true;
        }
      } else if (p0.x > p1.x && p0.y < p1.y) {
        // p0 is top right, p1 bottom left
        if (cursor.x <= p0.x && cursor.x >= p1.x && cursor.y >= p0.y && cursor.y <= p1.y) {
          isInside = true;
        }
      } else if (p0.x > p1.x && p0.y > p1.y) {
        // p0 bottom right, p1 top left
        if (cursor.x >= p1.x && cursor.x <= p0.x && cursor.y >= p1.y && cursor.y <= p0.y) {
          isInside = true;
        }
      } else {
        isInside = true;
      }

      if (isInside) {
        this.predictCanvas.strokeStyle = 'purple';
      }

      this.predictCanvas.box(box);*/
    }
  }

}
