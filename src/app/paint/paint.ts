import { EventEmitter, NgZone } from '@angular/core';
import { CompiledObject, PaintMode } from '../curves/modes/paint-mode';
import { FreeLineMode } from '../curves/modes/free-line-mode';
import { ControlService } from '../settings/control.service';
import { Settings } from '../settings/settings.interface';
import { StraightLineMode } from '../curves/modes/straight-line-mode';
import { ContinuousStraightLineMode } from '../curves/modes/continuous-straight-line-mode';

declare global {
  interface CanvasRenderingContext2D {
    /**
     * Clears context
     */
    clear(): void;
    /**
     * Draws dot onto predict canvas
     * @param position position of dot
     * @param width width of dot
     * @param color color of dot
     */
    dot(position: Uint32Array, width: number, color: string): void;
  }
}

export interface PaintManager {
  /**
   * Starts animation loop
   */
  StartFrameUpdate(): void;
  /**
   * Stops animation loop
   */
  StopFrameUpdate(): void;
  /**
   * Saves compiled object
   * @param object Object to save
   */
  SaveCompiledObject(object: CompiledObject): void;
  /**
   * @param point to normalize
   * @param enhance whenever to multiply by device dpi
   * @returns Normalized point
   */
  NormalizePoint(point: Uint32Array, enhance?: boolean): Uint32Array;
}

export class Paint {
  /**
   * Holds result of requestAnimationFrame
   */
  private animationFrameId: number;
  readonly mainCanvasCTX: CanvasRenderingContext2D;
  readonly predictCanvasCTX: CanvasRenderingContext2D;
  public statusEmitter: EventEmitter<string> = new EventEmitter<string>();
  private currentMode: PaintMode;
  private modes: Map<string, PaintMode> = new Map<string, PaintMode>();
  private currentSettings: Settings;
  private manager: PaintManager = {} as PaintManager;

  /**
   * Contains all compiled objects
   */
  public compiledObjectStorage: Map<string, Array<CompiledObject>> = new Map<string, []>();

  constructor(private ngZone: NgZone, private mainCanvas: HTMLCanvasElement, private predictCanvas: HTMLCanvasElement, private controlService: ControlService) {
    // Setup canvas, remember to rescale on window resize
    mainCanvas.height = mainCanvas.parentElement.offsetHeight * window.devicePixelRatio;
    mainCanvas.width = mainCanvas.parentElement.offsetWidth * window.devicePixelRatio;
    this.mainCanvasCTX = mainCanvas.getContext('2d');

    predictCanvas.height = mainCanvas.height;
    predictCanvas.width = mainCanvas.width;
    this.predictCanvasCTX = predictCanvas.getContext('2d');

    // Inject additional methods
    this.mainCanvasCTX.clear = () => {
      this.mainCanvasCTX.clearRect(0, 0, this.mainCanvasCTX.canvas.width, this.mainCanvasCTX.canvas.height);
    };

    this.predictCanvasCTX.clear = () => {
      this.predictCanvasCTX.clearRect(0, 0, this.predictCanvasCTX.canvas.width, this.predictCanvasCTX.canvas.height);
    };

    this.mainCanvasCTX.dot = (position: Uint32Array, width: number, color: string) => {
      this.mainCanvasCTX.beginPath();
      this.mainCanvasCTX.arc(
        position[0],
        position[1],
        width / Math.PI,
        0,
        2 * Math.PI,
        false
      );
      this.mainCanvasCTX.fillStyle = color;
      this.mainCanvasCTX.fill();
    };

    this.predictCanvasCTX.dot = (position: Uint32Array, width: number, color: string) => {
      this.predictCanvasCTX.beginPath();
      this.predictCanvasCTX.arc(
        position[0],
        position[1],
        width / Math.PI,
        0,
        2 * Math.PI,
        false
      );
      this.predictCanvasCTX.fillStyle = color;
      this.predictCanvasCTX.fill();
    };

    // Setup paint manager
    this.manager.StartFrameUpdate = () => {
      // Start new loop, obtain new id
      this.ngZone.runOutsideAngular(() => {
        this.currentMode?.OnFrameUpdate?.();
        this.animationFrameId = window.requestAnimationFrame(this.manager.StartFrameUpdate.bind(this));
      });
    };

    this.manager.StopFrameUpdate = () => {
      window.cancelAnimationFrame(this.animationFrameId);
    };

    this.manager.SaveCompiledObject = object => {
      if (!this.compiledObjectStorage.has(object.name)) {
        this.compiledObjectStorage.set(object.name, []);
      }

      this.compiledObjectStorage.get(object.name).push(object);
      this.modes.get(object.name).Reproduce(this.mainCanvasCTX, object);
    };

    this.manager.NormalizePoint = (point, enhance= false) => {
      // Make sure the point does not go beyond the screen
      point[0] = point[0] > window.innerWidth ? window.innerWidth : point[0];
      point[0] = point[0] < 0 ? 0 : point[0];

      point[1] = point[1] > window.innerHeight ? window.innerHeight : point[1];
      point[1] = point[1] < 0 ? 0 : point[1];

      if (!enhance) {
        return point;
      }

      point[0] *= window.devicePixelRatio;
      point[1] *= window.devicePixelRatio;

      return point;
    };

    // Setup modes
    this.currentSettings = this.controlService.settings.value;
    this.modes.set('free-line', new FreeLineMode(this.predictCanvasCTX, this.manager, this.currentSettings));
    this.modes.set('straight-line', new StraightLineMode(this.predictCanvasCTX, this.manager, this.currentSettings));
    this.modes.set('continuous-straight-line', new ContinuousStraightLineMode(this.predictCanvasCTX, this.manager, this.currentSettings));
    this.currentMode = this.modes.get(this.controlService.mode.value);
    this.controlService.mode.subscribe(mode => {
      if (!this.modes.has(mode)) {
        console.warn(`No mode named ${mode}!`);
        return;
      }
      this.currentMode = this.modes.get(mode);
      this.currentMode?.OnSelected();
    });

    // Response to settings change
    controlService.settings.subscribe(newSettings => {
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
    this.controlService.clear.subscribe(() => {
      this.mainCanvasCTX.clear();
      this.predictCanvasCTX.clear();
      this.compiledObjectStorage.clear();
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

    for (const [name, objects] of this.compiledObjectStorage) {
      for (const compiledObject of objects) {
        this.modes.get(name).Reproduce(this.mainCanvasCTX, compiledObject);
      }
    }

    this.currentMode?.MakeReady?.();
  }
}
