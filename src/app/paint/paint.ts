import { EventEmitter, NgZone } from '@angular/core';
import {CompiledObject, PaintMode} from '../curves/modes/paint-mode';
import { FreeLine, FreeLineMode } from '../curves/modes/free-line-mode';
import { SettingsService } from '../settings/settings.service';
import { Settings } from '../settings/settings.interface';
import { StraightLine, StraightLineMode } from '../curves/modes/straight-line-mode';
import { ContinuousStraightLineMode } from '../curves/modes/continuous-straight-line-mode';

declare global {
  interface CanvasRenderingContext2D {
    clear(): void;
  }
}

export class Paint {
  private readonly mainCanvasCTX: CanvasRenderingContext2D;
  private readonly predictCanvasCTX: CanvasRenderingContext2D;
  public statusEmitter: EventEmitter<string> = new EventEmitter<string>();
  private currentMode: PaintMode;
  private modes: Map<string, PaintMode> = new Map<string, PaintMode>();
  private currentSettings: Settings;

  /**
   * Contains all compiled objects
   */
  private compiledObjectStorage: Map<string, CompiledObject> = new Map<string, CompiledObject>();

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
    this.modes['free-line'] = new FreeLineMode(this.predictCanvasCTX, this.mainCanvasCTX, this.currentSettings);
    this.modes['straight-line'] = new StraightLineMode(this.predictCanvasCTX, this.mainCanvasCTX, this.currentSettings);
    this.modes['continuous-straight-line'] = new ContinuousStraightLineMode(this.predictCanvasCTX, this.mainCanvasCTX, this.currentSettings);

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
    this.predictCanvas.oncontextmenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    this.predictCanvas.onpointerdown = (event: PointerEvent) => {
      event.preventDefault();
    };

    this.predictCanvas.onpointermove = (event: PointerEvent) => {
      event.preventDefault();
    };

    this.predictCanvas.onpointerup = (event: PointerEvent) => {
      event.preventDefault();
    };

    this.predictCanvas.onwheel = (event: WheelEvent) => {
      event.preventDefault();
    };

    // TODO: Pointer cancel event
  }

  private static NormalizePoint(event: PointerEvent): Uint32Array {
    // TODO: multi-touch
    const point = new Uint32Array([
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
    // Mode has to do same point checking on it's own
    this.currentMode.OnFrameUpdate();

    // Loop animation frame
    this.ngZone.runOutsideAngular(() => {
      this.animFrameGlobID = window.requestAnimationFrame(this.OnLazyUpdate.bind(this));
    });
  }

  private MoveBegin(point: Uint32Array, button: number): void {
    this.modes[this.currentMode].OnMoveBegin(point, button);
    // Save for frame request processing
    this.lastPointer = point;

    // Draw and calc only on frame request
    this.OnLazyUpdate();
  }

  private MoveOccur(point: Uint32Array, button: number): void {
    this.modes[this.currentMode].OnMoveOccur(point, button);

    // Save for frame request processing
    this.lastPointer = point;
  }

  private MoveComplete(): void {
    const compiledObject = this.modes[this.currentMode].OnMoveComplete();

    if (compiledObject instanceof FreeLine) {
      this.freeLines.push(compiledObject);
    } else if (compiledObject instanceof  StraightLine) {
      this.straightLines.push(compiledObject);
    }

    delete this.lastPointer;
    window.cancelAnimationFrame(this.animFrameGlobID);
  }

  public SaveCompiledObject(): void {

  }

  public ChangeMode(mode: string): void {
    this.currentMode = mode;
    this.modes[this.currentMode].OnSelected();
  }

  public Clear(): void {
    this.mainCanvasCTX.clear();
    this.predictCanvasCTX.clear();

    this.modes[this.currentMode].MakeReady();

    this.freeLines = [];
    this.straightLines = [];
  }

  public Resize(): void {
    this.mainCanvas.height = this.mainCanvas.parentElement.offsetHeight * window.devicePixelRatio;
    this.mainCanvas.width = this.mainCanvas.parentElement.offsetWidth * window.devicePixelRatio;

    this.predictCanvas.height = this.mainCanvas.height;
    this.predictCanvas.width = this.mainCanvas.width;

    this.ReDraw();
  }

  public ReDraw(): void {
    this.mainCanvasCTX.clear();
    this.predictCanvasCTX.clear();

    for (const line of this.freeLines) {
        FreeLineMode.Reproduce(this.mainCanvasCTX, line);
    }

    for (const line of this.straightLines) {
        StraightLineMode.Reproduce(this.mainCanvasCTX, line);
    }

    this.modes[this.currentMode].MakeReady();
  }

  public Redo(): void {

  }

  public Undo(): void {

  }
}
