// import { EventEmitter, NgZone } from '@angular/core';
import { PaintMode } from '../curves/modes/paint-mode';
import { FreeLineMode } from '../curves/modes/free-line-mode';
import { Settings } from '../settings/settings.interface';
// import { Settings, SettingsService } from '../settings/settings.service';

declare global {
  interface OffscreenCanvasRenderingContext2D {
    clear(): void;
  }
}

export class Paint {
  private mainCanvas: OffscreenCanvasRenderingContext2D;
  private predictCanvas: OffscreenCanvasRenderingContext2D;
  // public statusEmitter: EventEmitter<string> = new EventEmitter<string>();
  // private animFrameGlobID;
  private lastPointer: Float32Array;

  private currentMode: PaintMode;
  private currentSettings: Settings;
  private pointerMoveListening = false;

  constructor() {

  }

  public Init(mainCanvas: OffscreenCanvas, predictCanvas: OffscreenCanvas) {
    this.mainCanvas = mainCanvas.getContext('2d');
    this.predictCanvas = predictCanvas.getContext('2d');

    // Defaults
    this.mainCanvas.lineJoin = 'round';
    this.mainCanvas.lineCap = 'round';
    this.mainCanvas.clear = () => {
      this.mainCanvas.clearRect(0, 0, this.mainCanvas.canvas.width, this.mainCanvas.canvas.height);
    };

    this.predictCanvas.lineJoin = 'round';
    this.predictCanvas.lineCap = 'round';
    this.predictCanvas.clear = () => {
      this.predictCanvas.clearRect(0, 0, this.predictCanvas.canvas.width, this.predictCanvas.canvas.height);
    };

    this.currentMode = new FreeLineMode(this.predictCanvas, this.mainCanvas, this.currentSettings);

    /* settingsService.settings.subscribe(newSettings => {
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
    };*/

    // TODO: Pointer cancel event
  }

  /*private NormalizePoint(event: PointerEvent): Float32Array {
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
  }*/

  /*public OnLazyUpdate(): void {

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
        this.currentMode = new FreeLineMode(this.predictCanvas, this.mainCanvas, this.currentSettings);
    }
  }

  public OnClear(): void {
    this.mainCanvas.clear();
    this.predictCanvas.clear();
  }

  public OnResize(event: Event): void {
    this.mainCanvas.height = this.mainCanvas.parentElement.offsetHeight * window.devicePixelRatio;
    this.mainCanvas.width = this.mainCanvas.parentElement.offsetWidth * window.devicePixelRatio;

    this.predictCanvas.height = this.mainCanvas.height;
    this.predictCanvas.width = this.mainCanvas.width;
  }

  public ReDraw(): void {

  }*/
}
