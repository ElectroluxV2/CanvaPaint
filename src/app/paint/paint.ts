import { EventEmitter, NgZone } from '@angular/core';
import { CompiledObject, PaintMode } from '../curves/modes/paint-mode';
import { FreeLineMode } from '../curves/modes/free-line-mode';
import { ControlService } from '../settings/control.service';
import { Settings } from '../settings/settings.interface';
import { StraightLineMode } from '../curves/modes/straight-line-mode';
import { ContinuousStraightLineMode } from '../curves/modes/continuous-straight-line-mode';

declare global {
  interface CanvasRenderingContext2D {
    clear(): void;
  }
}

export class Paint {
  readonly mainCanvasCTX: CanvasRenderingContext2D;
  readonly predictCanvasCTX: CanvasRenderingContext2D;
  public statusEmitter: EventEmitter<string> = new EventEmitter<string>();
  private currentMode: PaintMode;
  private modes: Map<string, PaintMode> = new Map<string, PaintMode>();
  private currentSettings: Settings;

  /**
   * Contains all compiled objects
   */
  public compiledObjectStorage: Map<string, Array<CompiledObject>> = new Map<string, []>();

  constructor(private ngZone: NgZone, private mainCanvas: HTMLCanvasElement, private predictCanvas: HTMLCanvasElement, private settingsService: ControlService) {
    // Setup canvas, remember to rescale on window resize
    mainCanvas.height = mainCanvas.parentElement.offsetHeight * window.devicePixelRatio;
    mainCanvas.width = mainCanvas.parentElement.offsetWidth * window.devicePixelRatio;
    this.mainCanvasCTX = mainCanvas.getContext('2d');

    predictCanvas.height = mainCanvas.height;
    predictCanvas.width = mainCanvas.width;
    this.predictCanvasCTX = predictCanvas.getContext('2d');

    // Inject clear
    this.mainCanvasCTX.clear = () => {
      this.mainCanvasCTX.clearRect(0, 0, this.mainCanvasCTX.canvas.width, this.mainCanvasCTX.canvas.height);
    };

    this.predictCanvasCTX.clear = () => {
      this.predictCanvasCTX.clearRect(0, 0, this.predictCanvasCTX.canvas.width, this.predictCanvasCTX.canvas.height);
    };

    // Setup modes
    this.currentSettings = this.settingsService.settings.value;
    this.modes.set('free-line', new FreeLineMode(this.predictCanvasCTX, this.mainCanvasCTX, this.currentSettings));
    this.modes.set('straight-line', new StraightLineMode(this.predictCanvasCTX, this.mainCanvasCTX, this.currentSettings));
    this.modes.set('continuous-straight-line', new ContinuousStraightLineMode(this.predictCanvasCTX, this.mainCanvasCTX, this.currentSettings));
    this.currentMode = this.modes.get(this.settingsService.mode.value);
    this.settingsService.mode.subscribe(mode => {
      if (!this.modes.has(mode)) {
        console.warn(`No mode named ${mode}!`);
        return;
      }
      this.currentMode = this.modes.get(mode);
    });

    // Response to settings change
    settingsService.settings.subscribe(newSettings => {
      this.currentMode?.OnSettingsUpdate(newSettings);

      // When color scheme has changed we need to redraw with different palette colour
      if (this.currentSettings?.darkModeEnabled !== newSettings.darkModeEnabled) {
        this.currentSettings = newSettings;
        this.ReDraw();
      } else {
        this.currentSettings = newSettings;
      }
    });

    // Response to clear
    this.settingsService.clear.subscribe(() => {
      this.mainCanvasCTX.clear();
      this.predictCanvasCTX.clear();
      this.currentMode?.MakeReady?.();
    });

    // Events
    this.predictCanvas.oncontextmenu = (event: MouseEvent) => {
      // Make right click possible to be caught in pointer down event
      event.preventDefault();
    };

    this.predictCanvas.onwheel = (event: WheelEvent) => {
      event.preventDefault();
      this.currentMode?.OnWheel?.(event);
    };

    this.predictCanvas.onpointerover = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerOver?.(event);
    };

    this.predictCanvas.onpointerenter = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerEnter?.(event);
    };

    this.predictCanvas.onpointerdown = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerDown?.(event);
    };

    this.predictCanvas.onpointermove = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerMove?.(event);
    };

    this.predictCanvas.onpointerup = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerUp?.(event);
    };

    this.predictCanvas.onpointercancel = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerCancel?.(event);
    };

    this.predictCanvas.onpointerout = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerOut?.(event);
    };

    this.predictCanvas.onpointerleave = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerLeave?.(event);
    };

    this.predictCanvas.ongotpointercapture = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerGotCapture?.(event);
    };

    this.predictCanvas.onlostpointercapture = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode?.OnPointerLostCapture?.(event);
    };
  }

  public OnFrameUpdate(): void {
    // Mode has to do same point checking on it's own
    this.currentMode?.OnFrameUpdate?.();
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

    /*for (const line of this.freeLines) {
        FreeLineMode.Reproduce(this.mainCanvasCTX, line);
    }

    for (const line of this.straightLines) {
        StraightLineMode.Reproduce(this.mainCanvasCTX, line);
    }*/

    this.currentMode?.MakeReady?.();
  }
}
