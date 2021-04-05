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

  private drawSubBoxes(line: FreeLine, point: Point): void {
    this.predictCanvas.beginPath();
    for (let i = 1; i < line.points.length; i++) {
      const p0 = line.points[i - 1];
      const p1 = line.points[i];

      const box = {
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
        if (point.x >= p0.x && point.x <= p1.x && point.y >= p0.y && point.y <= p1.y) {
          isInside = true;
        }
      } else if (p0.x < p1.x && p0.y > p1.y) {
        // p0 bottom left, p1 is top right
        if (point.x <= p1.x && point.x >= p0.x && point.y >= p1.y && point.y <= p0.y) {
          isInside = true;
        }
      } else if (p0.x > p1.x && p0.y < p1.y) {
        // p0 is top right, p1 bottom left
        if (point.x <= p0.x && point.x >= p1.x && point.y >= p0.y && point.y <= p1.y) {
          isInside = true;
        }
      } else if (p0.x > p1.x && p0.y > p1.y) {
        // p0 bottom right, p1 top left
        if (point.x >= p1.x && point.x <= p0.x && point.y >= p1.y && point.y <= p0.y) {
          isInside = true;
        }
      } else {
        isInside = true;
      }

      if (isInside) {
        this.predictCanvas.strokeStyle = 'purple';
      }

      this.predictCanvas.box(box);
    }
  }

}
