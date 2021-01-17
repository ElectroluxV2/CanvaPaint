import { EventEmitter, NgZone } from '@angular/core';
import { PaintMode } from '../curves/modes/paint-mode';
import { FreeLine, FreeLineMode } from '../curves/modes/free-line-mode';
import { SettingsService } from '../settings/settings.service';
import { Settings } from '../settings/settings.interface';

declare global {
  interface CanvasRenderingContext2D {
    clear(): void;
  }
}

export class Paint {
  private readonly mainCanvasCTX: CanvasRenderingContext2D;
  private readonly predictCanvasCTX: CanvasRenderingContext2D;
  public statusEmitter: EventEmitter<string> = new EventEmitter<string>();
  private animFrameGlobID;
  private lastPointer: Float32Array;

  private currentMode = 'free-line';
  private modes: PaintMode[] = [];
  private currentSettings: Settings;
  private pointerMoveListening = false;

  private freeLines: FreeLine[] = [];

  constructor(private ngZone: NgZone, private mainCanvas: HTMLCanvasElement, private predictCanvas: HTMLCanvasElement, private settingsService: SettingsService) {
    // Setup canvas, remember to rescale on window resize
    mainCanvas.height = mainCanvas.parentElement.offsetHeight * window.devicePixelRatio;
    mainCanvas.width = mainCanvas.parentElement.offsetWidth * window.devicePixelRatio;
    this.mainCanvasCTX = mainCanvas.getContext('2d');

    predictCanvas.height = mainCanvas.height;
    predictCanvas.width = mainCanvas.width;
    this.predictCanvasCTX = predictCanvas.getContext('2d');

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

    this.currentSettings = this.settingsService.settings.value;
    this.modes[this.currentMode] = new FreeLineMode(this.predictCanvasCTX, this.mainCanvasCTX, this.currentSettings);

    settingsService.settings.subscribe(newSettings => {
      this.modes[this.currentMode].OnSettingsUpdate(newSettings);

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
      this.MoveBegin(Paint.NormalizePoint(event));
    };

    this.predictCanvas.onpointermove = (event: PointerEvent) => {
      if (!this.pointerMoveListening) {
        return;
      }

      this.MoveOccur(Paint.NormalizePoint(event));
    };

    this.predictCanvas.onpointerup = (event: PointerEvent) => {
      this.pointerMoveListening = false;
      this.MoveOccur(Paint.NormalizePoint(event));
      this.MoveComplete();
    };

    // TODO: Pointer cancel event
  }

  private static NormalizePoint(event: PointerEvent): Float32Array {
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

  public OnLazyUpdate(): void {

    const loop = () => {
      this.ngZone.runOutsideAngular(() => {
        this.animFrameGlobID = window.requestAnimationFrame(this.OnLazyUpdate.bind(this));
      });
    };

    if (!this.lastPointer) { return loop(); }

    // Mode has to do same point checking on it's own
    this.modes[this.currentMode].OnLazyUpdate(this.lastPointer);

    return loop();
  }

  private MoveBegin(point: Float32Array): void {
    this.modes[this.currentMode].OnMoveBegin(point);
    // Save for frame request processing
    this.lastPointer = point;

    // Draw and calc only on frame request
    this.OnLazyUpdate();
  }

  private MoveOccur(point: Float32Array): void {
    this.modes[this.currentMode].OnMoveOccur(point);

    // Save for frame request processing
    this.lastPointer = point;
  }

  private MoveComplete(): void {
    const compiledObject = this.modes[this.currentMode].OnMoveComplete();

    if (compiledObject instanceof FreeLine) {
      this.freeLines.push(compiledObject as FreeLine);
    }

    delete this.lastPointer;
    window.cancelAnimationFrame(this.animFrameGlobID);
  }

  public ChangeMode(mode: string): void {
    console.log(mode);
    this.currentMode = mode;
  }

  public Clear(): void {
    this.mainCanvasCTX.clear();
    this.predictCanvasCTX.clear();
  }

  public Resize(): void {
    this.mainCanvas.height = this.mainCanvas.parentElement.offsetHeight * window.devicePixelRatio;
    this.mainCanvas.width = this.mainCanvas.parentElement.offsetWidth * window.devicePixelRatio;

    this.predictCanvas.height = this.mainCanvas.height;
    this.predictCanvas.width = this.mainCanvas.width;

    this.ReDraw();
  }

  public ReDraw(): void {
    for (const line of this.freeLines) {
      FreeLineMode.Reproduce(this.mainCanvasCTX, line);
    }
  }

  public Redo(): void {

  }

  public Undo(): void {

  }
}
