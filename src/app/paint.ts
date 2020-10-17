import { EventEmitter } from '@angular/core';

export class Paint {
    private readonly mainCanvasCTX: CanvasRenderingContext2D;
    private readonly predictCanvasCTX: CanvasRenderingContext2D;
    public statusEmitter: EventEmitter<string> = new EventEmitter<string>();

    private freeLineOccurringNow = false;
    private lastRawFreeLine: Point[] = [];
    private currentSmoothFreeLine: Point[] = [];
    private finishedSmoothLines: Float32Array[] = [];

    constructor(private mainCanvas: HTMLCanvasElement, private predictCanvas: HTMLCanvasElement) {

      mainCanvas.height = mainCanvas.parentElement.offsetHeight;
      mainCanvas.width = mainCanvas.parentElement.offsetWidth;
      this.mainCanvasCTX = mainCanvas.getContext('2d');

      predictCanvas.height = mainCanvas.height;
      predictCanvas.width = mainCanvas.width;
      this.predictCanvasCTX = predictCanvas.getContext('2d');

      // Defaults
      this.mainCanvasCTX.lineWidth = 5;
      this.mainCanvasCTX.lineJoin = 'round';
      this.mainCanvasCTX.lineCap = 'round';

      this.predictCanvasCTX.lineWidth = 5;
      this.predictCanvasCTX.lineJoin = 'round';
      this.predictCanvasCTX.lineCap = 'round';

      this.predictCanvas.onmousedown = (event: MouseEvent) => this.MoveBegin(this.NormalizeMouse(event));
      this.predictCanvas.onmousemove = (event: MouseEvent) => this.MoveOccur(this.NormalizeMouse(event));
      this.predictCanvas.onmouseup = (event: MouseEvent) => this.MoveComplete();

      this.predictCanvas.ontouchstart = (event: TouchEvent) => this.MoveBegin(this.NormalizeTouch(event));
      this.predictCanvas.ontouchmove = (event: TouchEvent) => this.MoveOccur(this.NormalizeTouch(event));
      this.predictCanvas.ontouchend = (event: TouchEvent) => this.MoveComplete();
    }

    private NormalizeTouch(event: TouchEvent): Point {
      const position = this.GetTouchPosition(event);

      position.left = position.left > window.innerWidth ? window.innerWidth : position.left;
      position.left = position.left < 0 ? 0 : position.left;

      position.top = position.top > window.innerHeight ? window.innerHeight : position.top;
      position.top = position.top < 0 ? 0 : position.top;

      return {
        x: position.left,
        y: position.top
      };
    }

    private NormalizeMouse(event: MouseEvent): Point {
      const position = this.GetMousePosition(event);

      position.left = position.left > window.innerWidth ? window.innerWidth : position.left;
      position.left = position.left < 0 ? 0 : position.left;

      position.top = position.top > window.innerHeight ? window.innerHeight : position.top;
      position.top = position.top < 0 ? 0 : position.top;

      return {
        x: position.left,
        y: position.top
      };
    }

    private GetCanvasPosition(): Position {
      let top = 0;
      let left = 0;

      let element: HTMLElement = this.mainCanvas;
      while (element && element.tagName !== 'BODY') {
        top += element.offsetTop - element.scrollTop;
        left += element.offsetLeft - element.scrollLeft;
        element = element.offsetParent as HTMLElement;
      }

      return {
        top,
        left
      };
    }

    private GetMousePosition(event: MouseEvent): Position {
      const canvasPosition = this.GetCanvasPosition();

      return {
        left: event.pageX - canvasPosition.left,
        top: event.pageY - canvasPosition.top
      };
    }

    private GetTouchPosition(event: TouchEvent): Position {
      const canvasPosition = this.GetCanvasPosition();
      const touch = event.touches[0];

      return {
        left: touch.pageX - canvasPosition.left,
        top: touch.pageY - canvasPosition.top
      };
    }

    private MoveBegin(point: Point): void {
      console.log('begin');
      this.freeLineOccurringNow = true;
      point.time = new Date().getTime();
      this.currentSmoothFreeLine.push(point);
    }

    private MoveOccur(point: Point): void {
      if (!this.freeLineOccurringNow) {
        return;
      }

      point.time = new Date().getTime();
      const lastSmooth = this.currentSmoothFreeLine[this.currentSmoothFreeLine.length - 1];
      const timeDifference = point.time - lastSmooth.time;

      if (timeDifference < 50 && this.lastRawFreeLine.length < 20) {
        this.lastRawFreeLine.push(point);

        this.DrawRawFreeLine();
        return;
      }

      this.lastRawFreeLine = [];
      this.currentSmoothFreeLine.push(point);

      if (this.currentSmoothFreeLine.length < 2) {
        return;
      }

      this.DrawPartOfSmoothFreeLine();
    }

    private MoveComplete(): void {
      this.freeLineOccurringNow = false;

      /*const elem = this.lastRawFreeLine.shift();
      if (elem) {
        this.currentSmoothFreeLine.push(elem);
      }

      const complete = this.DrawPartOfSmoothFreeLine();
      this.DrawSmoothFreeLine(complete);

      // Clear predict
      this.predictCanvasCTX.clearRect(0, 0, window.innerWidth, window.innerHeight);
      console.log('complete');*/

      this.currentSmoothFreeLine = [];
      this.lastRawFreeLine = [];
    }

    private DrawSmoothFreeLine(parts: Float32Array): void {
      if (!parts) {
        return;
      }

      this.mainCanvasCTX.beginPath();

      for (let i = 0; i < parts.length; i += 2) {
        this.mainCanvasCTX.lineTo(parts[i], parts[i - 1]);
      }

      this.mainCanvasCTX.strokeStyle = '#ec00ff';
      this.mainCanvasCTX.stroke();
    }

    private DrawRawFreeLine(color = '#FF0000'): void {
      this.predictCanvasCTX.beginPath();
      // Clear Predict
      this.predictCanvasCTX.clearRect(0, 0, this.predictCanvas.width, this.predictCanvas.height);
      // Start from last smooth
      const lastSmooth = this.currentSmoothFreeLine[this.currentSmoothFreeLine.length - 1];
      this.predictCanvasCTX.moveTo(lastSmooth.x, lastSmooth.y);
      // Predict from not corrected points

      for (const p of this.lastRawFreeLine) {
        p.time = null;
        this.predictCanvasCTX.lineTo(p.x, p.y);
      }

      this.predictCanvasCTX.strokeStyle = color;
      this.predictCanvasCTX.stroke();
    }

    private DrawPartOfSmoothFreeLine(color = '#ff0000'): Float32Array {
      if (this.currentSmoothFreeLine.length < 2) {
        return;
      }

      this.mainCanvasCTX.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const ar = [];

      for (const p of this.currentSmoothFreeLine) {
        ar.push(p.x, p.y);
    }

      const p1 = this.currentSmoothFreeLine[this.currentSmoothFreeLine.length - 1];
      const p2 = this.currentSmoothFreeLine[this.currentSmoothFreeLine.length - 2];

      let partsCount = Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y)) * 3;
      partsCount = partsCount <= 5 ? 5 : partsCount;

      // Draw part
      this.mainCanvasCTX.beginPath();
      const ret = this.curve(this.mainCanvasCTX, ar, 0.5, partsCount);
      this.mainCanvasCTX.strokeStyle = color;
      this.mainCanvasCTX.stroke();
      return ret;
    }

    private curve(ctx, points, tension = 0.5, numOfSeg = 25, close = false): Float32Array {
    let l = points.length;
    let rPos = 0;
    let cachePtr = 4;

    const rLen = (l - 2) * numOfSeg + 2 + (close ? 2 * numOfSeg : 0);
    const res = new Float32Array(rLen);
    const cache = new Float32Array((numOfSeg + 2) * 4);

    let pts = points.slice(0); // for cloning point array

    if (close) {
      pts.unshift(points[l - 1]); // insert end point as first point
      pts.unshift(points[l - 2]);
      pts.push(points[0], points[1]); // first point as last point
    }
    else {
      pts.unshift(points[1]); // copy 1. point and insert at beginning
      pts.unshift(points[0]);
      pts.push(points[l - 2], points[l - 1]);	// duplicate end-points
    }

    // cache inner-loop calculations as they are based on t alone
    cache[0] = 1; // 1,0,0,0

    for (let i = 1; i < numOfSeg; i++) {
      const st = i / numOfSeg;
      const st2 = st * st;
      const st3 = st2 * st;
      const st23 = st3 * 2;
      const st32 = st2 * 3;

      cache[cachePtr++] =	st23 - st32 + 1; // c1
      cache[cachePtr++] =	st32 - st23; // c2
      cache[cachePtr++] =	st3 - 2 * st2 + st;	// c3
      cache[cachePtr++] =	st3 - st2; // c4
    }

    cache[++cachePtr] = 1; // 0,1,0,0

    // tslint:disable-next-line:no-shadowed-variable
    const parse = (pts, cache, l) => {

        for (let i = 2, t; i < l; i += 2) {

          const pt1 = pts[i];
          const pt2 = pts[i + 1];
          const pt3 = pts[i + 2];
          const pt4 = pts[i + 3];

          const t1x = (pt3 - pts[i - 2]) * tension;
          const t1y = (pt4 - pts[i - 1]) * tension;
          const t2x = (pts[i + 4] - pt1) * tension;
          const t2y = (pts[i + 5] - pt2) * tension;

          for (t = 0; t < numOfSeg; t++) {

            // tslint:disable-next-line:no-bitwise
            const c = t << 2; // t * 4;

            const c1 = cache[c];
            const c2 = cache[c + 1];
            const c3 = cache[c + 2];
            const c4 = cache[c + 3];

            res[rPos++] = c1 * pt1 + c2 * pt3 + c3 * t1x + c4 * t2x;
            res[rPos++] = c1 * pt2 + c2 * pt4 + c3 * t1y + c4 * t2y;
          }
        }
      };

    // calc. points
    parse(pts, cache, l);

    if (close) {
      // l = points.length;
      pts = [];
      pts.push(points[l - 4], points[l - 3], points[l - 2], points[l - 1]); // second last and last
      pts.push(points[0], points[1], points[2], points[3]); // first and second
      parse(pts, cache, 4);
    }

    // add last point
    l = close ? 0 : points.length - 2;
    res[rPos++] = points[l];
    res[rPos] = points[l + 1];

    // add lines to path
    // tslint:disable-next-line:no-shadowed-variable
    for (let i = 0, l = res.length; i < l; i += 2) {
      ctx.lineTo(res[i], res[i + 1]);
    }

    return res;
  }
}

interface Point {
  x: number;
  y: number;
  time?: number;
}

interface Position {
  top: number;
  left: number;
}
