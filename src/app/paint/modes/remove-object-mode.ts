import { PaintMode } from './paint-mode';
import { Point } from '../protocol/point';
import { FreeLine } from './free-line-mode';
import {distanceFromPointToLine, pDistance, segmentDistToPoint} from '../curves/distance-from-point-to-line';

export class RemoveObjectMode extends PaintMode {
  readonly name = 'remove-object';
  private timer;

  public onPointerMove(event: PointerEvent) {
    const point = new Point(event.offsetX, event.offsetY);
    const normalized = this.paintManager.normalizePoint(point);

    const freeLine = this.paintManager.compiledObjectStorage.get('free-line')?.[0] as FreeLine;
    if (!freeLine) {
      return;
    }

    clearTimeout(this.timer);
    this.timer = setTimeout(this.next.bind(this), 10, normalized, freeLine);
  }

  private next(point: Point, freeLine: FreeLine): void {
    let max = Number.MIN_SAFE_INTEGER;
    let min = Number.MAX_SAFE_INTEGER;

    for (let i = 1; i < freeLine.points.length; i++) {
      const p1 = freeLine.points[i - 1];
      const p2 = freeLine.points[i];

      this.predictCanvas.dot(p1, 10, 'orange');
      this.predictCanvas.dot(p2, 10, 'orange');

      const d = segmentDistToPoint(p1, p2, point);

      if (d > max) {
        max = d;
      } else if (d < min) {
        min = d;
      }
    }

    if (min < 10) {
      freeLine.color = 'orange';
    } else {
      freeLine.color = 'white';
    }

    this.paintManager.redraw();

    console.log(`Minimum distance is ${min}, max is ${max}`);
  }

}
