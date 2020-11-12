import { EventEmitter, NgZone } from '@angular/core';
import { CardinalSpline } from './curves/cardinal-spline';

export class Paint {
    private readonly mainCanvasCTX: CanvasRenderingContext2D;
    private readonly predictCanvasCTX: CanvasRenderingContext2D;
    public statusEmitter: EventEmitter<string> = new EventEmitter<string>();
    private canvasPosition: Float32Array = new Float32Array(2);
    private animFrameGlobID;

    private freeLineOccurringNow = false;
    private currentSpline: CardinalSpline;


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

      this.predictCanvasCTX.lineWidth = 5;
      this.predictCanvasCTX.lineJoin = 'round';
      this.predictCanvasCTX.lineCap = 'round';

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
      console.log('a');

      this.ngZone.runOutsideAngular(() => {
        this.animFrameGlobID = window.requestAnimationFrame(this.OnLazyUpdate.bind(this));
      });
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

      // For realtime processing
      this.currentSpline = new CardinalSpline(this.mainCanvasCTX, this.predictCanvasCTX, 1, 5, 'red');

      this.OnLazyUpdate();
    }

    private MoveOccur(point: Float32Array): void {
      if (!this.freeLineOccurringNow) { return; }

      this.predictCanvasCTX.clearRect(0, 0, this.predictCanvas.width, this.predictCanvas.height);
      this.currentSpline.AddPoint(point);
    }

    private MoveComplete(): void {
      this.predictCanvasCTX.clearRect(0, 0, this.predictCanvas.width, this.predictCanvas.height);
      this.freeLineOccurringNow = false;
      this.currentSpline.Finish();

      window.cancelAnimationFrame(this.animFrameGlobID);

      // Cleanup
      delete this.currentSpline;
    }
}
