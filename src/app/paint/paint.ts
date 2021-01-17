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
  private lastPointer: Float32Array;

  private currentMode: PaintMode;
  private currentSettings: Settings;
  private pointerMoveListening = false;

  constructor() { }

  public Init(mainCanvas: OffscreenCanvas, predictCanvas: OffscreenCanvas, devicePixelRatio: number) {
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
  }

  // TODO: Pointer cancel event
  public OnPointerDown(point: Float32Array): void {
    this.pointerMoveListening = true;
    this.MoveBegin(point);
  }

  public OnPointerMove(point: Float32Array) {
    if (!this.pointerMoveListening) {
      return;
    }

    this.MoveOccur(point);
  }

  public OnPointerUp(point: Float32Array) {
    this.pointerMoveListening = false;
    this.MoveOccur(point);
    this.MoveComplete();
  }

  public OnAnimationFrame(): void {
    if (!this.lastPointer) {
      return;
    }

    // Mode has to do same point checking on it's own
    this.currentMode.OnLazyUpdate(this.lastPointer);
  }

  public OnSettingsUpdate(newSettings: Settings): void {
    this.currentMode.OnSettingsUpdate(newSettings);

    if (this.currentSettings?.darkModeEnabled !== newSettings.darkModeEnabled) {
      this.currentSettings = newSettings;
      this.ReDraw();
    } else {
      this.currentSettings = newSettings;
    }
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

  private MoveBegin(point: Float32Array): void {
    this.currentMode.OnMoveBegin(point);
    // Save for frame request processing
    this.lastPointer = point;
  }

  private MoveOccur(point: Float32Array): void {
    this.currentMode.OnMoveOccur(point);

    // Save for frame request processing
    this.lastPointer = point;
  }

  private MoveComplete(): void {
    this.currentMode.OnMoveComplete();

    delete this.lastPointer;
  }

  private ReDraw(): void {

  }
}
