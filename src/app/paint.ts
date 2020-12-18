import { EventEmitter, NgZone } from '@angular/core';
import { PaintMode } from './curves/modes/paint-mode';
import { FreeLineMode } from './curves/modes/free-line-mode';
import { Settings, SettingsService } from './settings/settings.service';

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

  private currentMode: PaintMode;
  private currentSettings: Settings;
  private pointerMoveListening = false;



  constructor(private ngZone: NgZone, private mainCanvas: HTMLCanvasElement, private predictCanvas: HTMLCanvasElement, private settingsService: SettingsService) {
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

    this.currentMode = new FreeLineMode(this.predictCanvasCTX, this.mainCanvasCTX, this.currentSettings);

    settingsService.settings.subscribe(newSettings => {
      this.currentMode.OnSettingsUpdate(newSettings);

      if (this.currentSettings?.darkModeEnabled !== newSettings.darkModeEnabled) {
        this.currentSettings = newSettings;
        this.ReDraw();
      } else {
        this.currentSettings = newSettings;
      }
    });

    // Events
    this.predictCanvas.onpointerdown = (event: PointerEvent) => {
      this.pointerMoveListening = true;
      this.MoveBegin(this.NormalizePoint(event));
    };

    this.predictCanvas.onpointermove = (event: PointerEvent) => {
      if (!this.pointerMoveListening) {
        return;
      }

      this.MoveOccur(this.NormalizePoint(event));
    };

    this.predictCanvas.onpointerup = (event: PointerEvent) => {
      this.pointerMoveListening = false;
      this.MoveOccur(this.NormalizePoint(event));
      this.MoveComplete();
    };

    // TODO: Pointer cancel event
  }

  private NormalizePoint(event: PointerEvent): Float32Array {
    // TODO: multi-touch
    const point = new Float32Array([
      event.offsetX,
      event.offsetY
    ]);

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

  public OnLazyUpdate(): void {

    const loop = () => {
      this.ngZone.runOutsideAngular(() => {
        this.animFrameGlobID = window.requestAnimationFrame(this.OnLazyUpdate.bind(this));
      });
    };

    if (!this.lastPointer) { return loop(); }

    // Mode has to do same point checking on it's own
    this.currentMode.OnLazyUpdate(this.lastPointer);

    return loop();
  }

  private MoveBegin(point: Float32Array): void {
    this.currentMode.OnMoveBegin(point);
    // Save for frame request processing
    this.lastPointer = point;

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
