import { EventEmitter } from '@angular/core';
import { PaintMode } from './modes/paint-mode';
import { FreeLineMode } from './modes/free-line-mode';
import { ControlService } from '../settings/control.service';
import { Settings } from '../settings/settings.interface';
import { StraightLineMode } from './modes/straight-line-mode';
import { ContinuousStraightLineMode } from './modes/continuous-straight-line-mode';
import { Point } from './protocol/point';
import { PaintManager } from './paint-manager';
import { NetworkManager } from './network-manager';
import { Reference } from './protocol/protocol';

declare global {
  interface CanvasRenderingContext2D {
    /**
     * Clears context
     */
    clear(): void;
    /**
     * Draws dot onto predict canvas
     *
     * @param position position of dot
     * @param width width of dot
     * @param color color of dot
     */
    dot(position: Point, width: number, color: string): void;
  }
}

export class Paint {
  readonly mainCanvasCTX: CanvasRenderingContext2D;
  readonly predictCanvasCTX: CanvasRenderingContext2D;
  readonly predictCanvasNetworkCTX: CanvasRenderingContext2D;

  public statusEmitter: EventEmitter<string> = new EventEmitter<string>();

  private currentMode: Reference<PaintMode> = new Reference<PaintMode>();
  private modes: Map<string, PaintMode> = new Map<string, PaintMode>();
  private currentSettings: Settings;

  private readonly paintManager: PaintManager;
  private readonly networkManager: NetworkManager;

  constructor(private mainCanvas: HTMLCanvasElement, private predictCanvas: HTMLCanvasElement, private predictCanvasNetwork: HTMLCanvasElement, private controlService: ControlService) {
    // Setup canvas, remember to rescale on window resize
    mainCanvas.height = mainCanvas.parentElement.offsetHeight * devicePixelRatio;
    mainCanvas.width = mainCanvas.parentElement.offsetWidth * devicePixelRatio;
    this.mainCanvasCTX = mainCanvas.getContext('2d');
    this.mainCanvasCTX.scale(devicePixelRatio, devicePixelRatio);

    predictCanvas.height = mainCanvas.height;
    predictCanvas.width = mainCanvas.width;
    this.predictCanvasCTX = predictCanvas.getContext('2d');
    this.predictCanvasCTX.scale(devicePixelRatio, devicePixelRatio);

    predictCanvasNetwork.height = mainCanvas.height;
    predictCanvasNetwork.width = mainCanvas.width;
    this.predictCanvasNetworkCTX = predictCanvasNetwork.getContext('2d');
    this.predictCanvasNetworkCTX.scale(devicePixelRatio, devicePixelRatio);

    this.injectCanvas();

    this.paintManager = new PaintManager(this.currentMode, this.modes, this.mainCanvasCTX, this.controlService);

    this.networkManager = new NetworkManager(this.modes, this.predictCanvasNetworkCTX, this.paintManager, this.controlService);

    this.handleModes();

    this.responseToControlService();

    this.handleEvents();
  }

  public resize(): void {
    this.mainCanvas.height = this.mainCanvas.parentElement.offsetHeight * devicePixelRatio;
    this.mainCanvas.width = this.mainCanvas.parentElement.offsetWidth * devicePixelRatio;

    this.mainCanvasCTX.scale(devicePixelRatio, devicePixelRatio);

    this.predictCanvas.height = this.mainCanvas.height;
    this.predictCanvas.width = this.mainCanvas.width;

    this.predictCanvasCTX.scale(devicePixelRatio, devicePixelRatio);

    this.predictCanvasNetwork.height = this.mainCanvas.height;
    this.predictCanvasNetwork.width = this.mainCanvas.width;

    this.predictCanvasNetworkCTX.scale(devicePixelRatio, devicePixelRatio);

    this.redraw();
  }

  public redraw(): void {
    this.mainCanvasCTX.clear();
    this.predictCanvasCTX.clear();
    this.paintManager.redraw();
    this.currentMode.value?.makeReady?.();
  }

  private handleEvents(): void {
    // Events
    this.predictCanvas.oncontextmenu = (event: MouseEvent) => {
      // Make right click possible to be caught in pointer down event
      event.preventDefault();
    };

    this.predictCanvas.onwheel = (event: WheelEvent) => {
      event.preventDefault();
      this.currentMode.value?.onWheel?.(event);
    };

    this.predictCanvas.onpointerover = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode.value?.onPointerOver?.(event);
    };

    this.predictCanvas.onpointerenter = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode.value?.onPointerEnter?.(event);
    };

    this.predictCanvas.onpointerdown = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode.value?.onPointerDown?.(event);
    };

    this.predictCanvas.onpointermove = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode.value?.onPointerMove?.(event);
    };

    this.predictCanvas.onpointerup = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode.value?.onPointerUp?.(event);
    };

    this.predictCanvas.onpointercancel = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode.value?.onPointerCancel?.(event);
    };

    this.predictCanvas.onpointerout = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode.value?.onPointerOut?.(event);
    };

    this.predictCanvas.onpointerleave = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode.value?.onPointerLeave?.(event);
    };

    this.predictCanvas.ongotpointercapture = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode.value?.onPointerGotCapture?.(event);
    };

    this.predictCanvas.onlostpointercapture = (event: PointerEvent) => {
      event.preventDefault();
      this.currentMode.value?.onPointerLostCapture?.(event);
    };
  }

  private injectCanvas(): void {
    // Inject additional methods
    this.mainCanvasCTX.clear = () => {
      this.mainCanvasCTX.clearRect(0, 0, this.mainCanvasCTX.canvas.width, this.mainCanvasCTX.canvas.height);
    };

    this.predictCanvasCTX.clear = () => {
      this.predictCanvasCTX.clearRect(0, 0, this.predictCanvasCTX.canvas.width, this.predictCanvasCTX.canvas.height);
    };

    this.predictCanvasNetworkCTX.clear = () => {
      this.predictCanvasNetworkCTX.clearRect(0, 0, this.predictCanvasNetworkCTX.canvas.width, this.predictCanvasNetworkCTX.canvas.height);
    };

    const dot = (canvas: CanvasRenderingContext2D, position: Point, width: number, color: string) => {
      canvas.beginPath();
      canvas.arc(
        position.x,
        position.y,
        width / Math.PI,
        0,
        2 * Math.PI,
        false
      );
      canvas.fillStyle = color;
      canvas.fill();
    };

    this.mainCanvasCTX.dot = (position: Point, width: number, color: string) => dot(this.mainCanvasCTX, position, width, color);
    this.predictCanvasCTX.dot = (position: Point, width: number, color: string) => dot(this.predictCanvasCTX, position, width, color);
  }

  private handleModes(): void {
    // Setup modes
    this.currentSettings = this.controlService.settings.value;

    const modesArray = [
      new FreeLineMode(this.predictCanvasCTX, this.paintManager, this.networkManager, this.currentSettings),
      new StraightLineMode(this.predictCanvasCTX, this.paintManager, this.networkManager, this.currentSettings),
      new ContinuousStraightLineMode(this.predictCanvasCTX, this.paintManager, this.networkManager, this.currentSettings)
    ];

    const nameRegex = new RegExp('\([A-z]+([A-z]|-|[0-9])+)\S', 'g');

    for (const mode of modesArray) {

      if (!('name' in mode)) {
        console.warn(`Cannot add mode without name!`);
        continue;
      }

      if (nameRegex.test(mode.name)) {
        console.warn(`Mode with name "${mode.name}" doesn't match name regex!`);
        continue;
      }

      this.modes.set(mode.name, mode);
    }

    this.currentMode.value = this.modes.get(this.controlService.mode.value);
    this.controlService.mode.subscribe(mode => {
      if (!this.modes.has(mode)) {
        console.warn(`No mode named ${mode}!`);
        return;
      }
      this.currentMode.value?.onUnSelected?.();
      this.currentMode.value = this.modes.get(mode);
      this.currentMode.value?.onSelected?.();
    });
  }

  private responseToControlService(): void {
    // Response to settings change
    this.controlService.settings.subscribe(newSettings => {
      this.currentMode.value?.onSettingsUpdate(newSettings);

      // When color scheme has changed we need to redraw with different palette colour
      if (this.currentSettings?.darkModeEnabled !== newSettings.darkModeEnabled) {
        this.currentSettings = newSettings;
        this.redraw();
      } else {
        this.currentSettings = newSettings;
      }
    });

    // Response to clear
    this.controlService.clear.subscribe(resend => {
      if (resend) {
        this.networkManager.sendClear();
      }
      this.mainCanvasCTX.clear();
      this.predictCanvasCTX.clear();
      this.paintManager.clear();
      this.currentMode.value?.makeReady?.();
    });
  }
}
