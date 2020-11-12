import { EventEmitter, NgZone } from '@angular/core';
import { CardinalSpline } from './curves/cardinal-spline';
import {LazyBrush} from './curves/lazy-brush';

declare global {
  interface CanvasRenderingContext2D {
    clear(): void;
  }
}

export class Paint {
    private readonly mainCanvasCTX: CanvasRenderingContext2D;
    private readonly predictCanvasCTX: CanvasRenderingContext2D;
    public statusEmitter: EventEmitter<string> = new EventEmitter<string>();
    private canvasPosition: Float32Array = new Float32Array(2);
    private animFrameGlobID;
    private lastPointer: Float32Array;

    private freeLineOccurringNow = false;
    private currentSpline: CardinalSpline;
    private currentLazyBrush: LazyBrush;

    constructor(private ngZone: NgZone, private mainCanvas: HTMLCanvasElement, private predictCanvas: HTMLCanvasElement) {
      // Calculate canvas position once, then only on window resize
      this.CalcCanvasPosition();

      // Setup canvas, remember to rescale on window resize
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
      this.mainCanvasCTX.clear = () => {
        this.mainCanvasCTX.clearRect(0, 0, this.mainCanvasCTX.canvas.width, this.mainCanvasCTX.canvas.height);
      };

      this.predictCanvasCTX.lineWidth = 5;
      this.predictCanvasCTX.lineJoin = 'round';
      this.predictCanvasCTX.lineCap = 'round';
      this.predictCanvasCTX.clear = () => {
        this.predictCanvasCTX.clearRect(0, 0, this.predictCanvasCTX.canvas.width, this.predictCanvasCTX.canvas.height);
      };

      // Events
      this.predictCanvas.onmousedown = (event: MouseEvent) => {
        const p = this.NormalizePoint(event);
        this.MoveBegin();
        this.MoveOccur(p);
      };

      this.predictCanvas.onmousemove = (event: MouseEvent) => this.MoveOccur(this.NormalizePoint(event));

      this.predictCanvas.onmouseup = (event: MouseEvent) => {
        const p = this.NormalizePoint(event);
        this.MoveOccur(p);
        this.MoveComplete();
      };

      this.predictCanvas.ontouchstart = (event: TouchEvent) => {
        const p = this.NormalizePoint(event);
        this.MoveBegin();
        this.MoveOccur(p);
      };

      this.predictCanvas.ontouchmove = (event: TouchEvent) => this.MoveOccur(this.NormalizePoint(event));

      this.predictCanvas.ontouchend = (event: TouchEvent) => this.MoveComplete();
    }

    public OnLazyUpdate(): void {

      const loop = () => {
        this.ngZone.runOutsideAngular(() => {
          this.animFrameGlobID = window.requestAnimationFrame(this.OnLazyUpdate.bind(this));
        });
      };

      if (!this.lastPointer) { return loop(); }
      if (!this.currentSpline) { return loop(); }
      if (!this.currentLazyBrush) { return loop(); }

      this.currentLazyBrush.Update(this.lastPointer);

      // Same redraw prevention
      if (!this.currentLazyBrush.HasMoved && !this.currentSpline.IsEmpty) { return loop(); }

      // TODO: Networking staff
      const compiled = this.currentSpline.AddPoint(this.currentLazyBrush.Get());

      return loop();
    }

    private NormalizePoint(event: TouchEvent | MouseEvent): Float32Array {
      // TODO: multi-touch
      const point = event instanceof TouchEvent ? this.GetTouchPosition(event) : this.GetMousePosition(event);

      // Make sure the point does not go beyond the screen
      point[0] = point[0] > window.innerWidth ? window.innerWidth : point[0];
      point[0] = point[0] < 0 ? 0 : point[0];

      point[1] = point[1] > window.innerHeight ? window.innerHeight : point[1];
      point[1] = point[1] < 0 ? 0 : point[1];

      return point;
    }

    private CalcCanvasPosition(): void {
      let x = 0;
      let y = 0;

      let element: HTMLElement = this.mainCanvas;
      while (element && element.tagName !== 'BODY') {
        y += element.offsetTop - element.scrollTop;
        x += element.offsetLeft - element.scrollLeft;
        element = element.offsetParent as HTMLElement;
      }

      this.canvasPosition[0] = x;
      this.canvasPosition[1] = y;
    }

    private GetMousePosition(event: MouseEvent): Float32Array {
      // Actual position on canvas
      return new Float32Array([event.pageX - this.canvasPosition[0], event.pageY - this.canvasPosition[1]]);
    }

    private GetTouchPosition(event: TouchEvent): Float32Array {
      // TODO: multi-touch
      // TODO: hand on screen mode
      const touch = event.touches[0];
      // Actual position on canvas
      return new Float32Array([touch.pageX - this.canvasPosition[0], touch.pageY - this.canvasPosition[1]]);
    }

    private MoveBegin(): void {
      this.freeLineOccurringNow = true;

      // Draw and calc only on frame request
      this.OnLazyUpdate();
    }

    private MoveOccur(point: Float32Array): void {
      if (!this.freeLineOccurringNow) { return; }

      if (!this.currentSpline) {
        // For realtime processing
        this.currentSpline = new CardinalSpline(this.mainCanvasCTX, this.predictCanvasCTX, 1, 5, 'red');
      }

      if (!this.currentLazyBrush) {
        // Make radius 1% of screen width nor height
        // TODO: Settings
        const w10 = this.predictCanvas.width * 0.01;
        const h10 = this.predictCanvas.height * 0.01;

        // Draw stabilizer
        this.currentLazyBrush = new LazyBrush(Math.max(w10, h10), point);
      }

      // Save for frame request processing
      this.lastPointer = point;
    }

    private MoveComplete(): void {
      this.freeLineOccurringNow = false;

      window.cancelAnimationFrame(this.animFrameGlobID);

      // TODO: Networking staff
      const compiled = this.currentSpline.Finish();

      // Cleanup
      delete this.currentSpline;
      delete this.currentLazyBrush;
      delete this.lastPointer;
    }
}
