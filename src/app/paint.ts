import { EventEmitter, NgZone } from '@angular/core';
import { PaintMode } from './curves/modes/paint-mode';
import { FreeLineMode } from './curves/modes/free-line-mode';

declare global {
  interface CanvasRenderingContext2D {
    clear(): void;
  }
}

export interface PaintSettings {
  color: string;
  width: number;
  lazyMultiplier: number;
  tolerance: number;
}

export class Paint {
  private readonly mainCanvasCTX: CanvasRenderingContext2D;
  private readonly predictCanvasCTX: CanvasRenderingContext2D;
  public statusEmitter: EventEmitter<string> = new EventEmitter<string>();
  private canvasPosition: Float32Array = new Float32Array(2);
  private animFrameGlobID;
  private lastPointer: Float32Array;

  private currentMode: PaintMode;
  private readonly currentSettings: PaintSettings;
  private startEmitted = false;

  public darkModeEnabled = false;
  readonly colors = {
    light: {
      red: '#f44336',
      blue: '#2196f3',
      green: '#4caf50',
      yellow: '#ffeb3b',
      black: '#212121',
      internal: '#673ab7'
    },
    dark: {
      red: '#ba2418',
      blue: '#176baa',
      green: '#27a02b',
      yellow: '#c6b515',
      black: '#fefefe',
      internal: '#673ab7'
    }
  };

  constructor(private ngZone: NgZone, private mainCanvas: HTMLCanvasElement, private predictCanvas: HTMLCanvasElement) {
    this.darkModeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches;
    window.matchMedia('(prefers-color-scheme: dark)').onchange = (e) => {
      this.darkModeEnabled = e.matches;
      this.currentSettings.color = this.GetColor(this.GetColorKey(this.currentSettings.color));
      this.currentMode.OnSettingsUpdate(this.currentSettings);
      this.ReDraw();
    };

    // Calculate canvas position once, then only on window resize
    this.CalcCanvasPosition();

    // Setup canvas, remember to rescale on window resize
    mainCanvas.height = mainCanvas.parentElement.offsetHeight * window.devicePixelRatio;
    mainCanvas.width = mainCanvas.parentElement.offsetWidth * window.devicePixelRatio;
    this.mainCanvasCTX = mainCanvas.getContext('2d');

    predictCanvas.height = mainCanvas.height;
    predictCanvas.width = mainCanvas.width;
    this.predictCanvasCTX = predictCanvas.getContext('2d');

    this.mainCanvasCTX.translate(0.5, 0.5);
    this.predictCanvasCTX.translate(0.5, 0.5);

    // Defaults
    this.mainCanvasCTX.lineJoin = 'round';
    this.mainCanvasCTX.lineCap = 'round';
    this.mainCanvasCTX.clear = () => {
      this.mainCanvasCTX.clearRect(0, 0, this.mainCanvasCTX.canvas.width, this.mainCanvasCTX.canvas.height);
    };

    this.predictCanvasCTX.lineJoin = 'round';
    this.predictCanvasCTX.lineCap = 'round';
    this.predictCanvasCTX.clear = () => {
      this.predictCanvasCTX.clearRect(0, 0, this.predictCanvasCTX.canvas.width, this.predictCanvasCTX.canvas.height);
    };

    // TODO: make no need for setting them here
    // Preselected options
    this.currentSettings = {
      color: this.GetColor('black'),
      width: 5,
      lazyMultiplier: 0.06,
      tolerance: 1
    };

    this.currentMode = new FreeLineMode(this.predictCanvasCTX, this.mainCanvasCTX, this.currentSettings);

    // Events
    this.predictCanvas.onmousedown = (event: MouseEvent) => {
      this.MoveBegin(this.NormalizePoint(event));
      this.startEmitted = true;
    };

    this.predictCanvas.onmousemove = (event: MouseEvent) => {
      this.MoveOccur(this.NormalizePoint(event));
    };

    this.predictCanvas.onmouseup = (event: MouseEvent) => {
      if (!this.startEmitted) {
        return;
      }
      this.startEmitted = false;
      const p = this.NormalizePoint(event);
      this.MoveOccur(p);
      this.MoveComplete();
    };

    this.predictCanvas.ontouchstart = (event: TouchEvent) => {
      const point = this.NormalizePoint(event);
      this.MoveBegin(point);
      this.lastPointer = point;
    };

    this.predictCanvas.ontouchmove = (event: TouchEvent) => {
      this.MoveOccur(this.NormalizePoint(event));
    };

    this.predictCanvas.ontouchend = () => {
      this.MoveComplete();
    };
  }

  public GetColorKey(value: string): string {
    for (const index in this.colors) {
      if (!this.colors.hasOwnProperty(index)) {
        continue;
      }
      for (const key in this.colors[index]) {
        if (!this.colors[index].hasOwnProperty(key)) {
          continue;
        }

        if (value === this.colors[index][key]) {
          return key;
        }
      }
    }
  }

  private GetColor(key: string): string {
    const index = this.darkModeEnabled ? 'dark' : 'light';
    return this.colors[index][key];
  }

  private NormalizePoint(event: TouchEvent | MouseEvent): Float32Array {
    // TODO: multi-touch
    const point = event instanceof TouchEvent ? this.GetTouchPosition(event) : this.GetMousePosition(event);

    // Make sure the point does not go beyond the screen
    point[0] = point[0] > window.innerWidth ? window.innerWidth : point[0];
    point[0] = point[0] < 0 ? 0 : point[0];

    point[1] = point[1] > window.innerHeight ? window.innerHeight : point[1];
    point[1] = point[1] < 0 ? 0 : point[1];

    point[0] *= window.devicePixelRatio;
    point[1] *= window.devicePixelRatio;

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

  public OnLazyUpdate(): void {

    const loop = () => {
      this.ngZone.runOutsideAngular(() => {
        this.animFrameGlobID = window.requestAnimationFrame(this.OnLazyUpdate.bind(this));
      });
    };

    if (!this.lastPointer) { return loop(); }

    this.currentMode.OnLazyUpdate(this.lastPointer);

    return loop();
  }

  private MoveBegin(point: Float32Array): void {
    this.currentMode.OnMoveBegin(point);
    // Draw and calc only on frame request
    this.OnLazyUpdate();
  }

  private MoveOccur(point: Float32Array): void {
    this.currentMode.OnMoveOccur(point);

    // Save for frame request processing
    this.lastPointer = point;
  }

  private MoveComplete(): void {
    this.currentMode.OnMoveComplete();

    delete this.lastPointer;
    window.cancelAnimationFrame(this.animFrameGlobID);
  }

  public OnModeChange(mode: string): void {
    switch (mode) {
      case 'free-line':
      default:
        this.currentMode = new FreeLineMode(this.predictCanvasCTX, this.mainCanvasCTX, this.currentSettings);
    }
  }

  public OnColorChange(color: string): void {
    this.currentSettings.color = this.GetColor(color.toLocaleLowerCase());
    this.currentMode.OnSettingsUpdate(this.currentSettings);
  }

  public OnClear(): void {
    this.mainCanvasCTX.clear();
    this.predictCanvasCTX.clear();
  }

  public OnResize(event: Event): void {
    this.CalcCanvasPosition();

    this.mainCanvas.height = this.mainCanvas.parentElement.offsetHeight * window.devicePixelRatio;
    this.mainCanvas.width = this.mainCanvas.parentElement.offsetWidth * window.devicePixelRatio;

    this.predictCanvas.height = this.mainCanvas.height;
    this.predictCanvas.width = this.mainCanvas.width;
  }

  public ReDraw(): void {

  }
}
