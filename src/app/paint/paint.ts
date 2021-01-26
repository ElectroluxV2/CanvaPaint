import { EventEmitter, NgZone } from '@angular/core';
import { PaintMode } from '../curves/modes/paint-mode';
import { FreeLine, FreeLineMode } from '../curves/modes/free-line-mode';
import { SettingsService } from '../settings/settings.service';
import { Settings } from '../settings/settings.interface';
import {StraightLine, StraightLineMode} from '../curves/modes/straight-line-mode';
import {ContinuousStraightLineMode} from '../curves/modes/continuous-straight-line-mode';

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
  private pointerHasMoved = false;

  private freeLines: FreeLine[] = [];
  private straightLines: StraightLine[] = [];
  private zoom = {
    scale: {
      modifier: 1,
      world: {
        x: 0,
        y: 0,
      },
      screen: {
        x: 0,
        y: 0
      }
    },
    mouse: {
      world: {
        x: 0,
        y: 0,
      },
      screen: {
        x: 0,
        y: 0
      }
    }
  };

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
      this.modes[this.currentMode].OnSettingsUpdate(newSettings);

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

      this.pointerHasMoved = false;
      this.pointerMoveListening = true;
      this.MoveBegin(Paint.NormalizePoint(event), event.button ?? 0);
    };

    this.predictCanvas.onpointermove = (event: PointerEvent) => {
      event.preventDefault();
      this.pointerHasMoved = true;

      const bounds = this.mainCanvas.getBoundingClientRect();
      this.zoom.mouse.screen.x = event.clientX - bounds.left;
      this.zoom.mouse.screen.y = event.clientY - bounds.top;

      if (!this.pointerMoveListening) {
        return;
      }

      this.MoveOccur(Paint.NormalizePoint(event), event.button ?? 0);
    };

    this.predictCanvas.onpointerup = (event: PointerEvent) => {
      if (!this.pointerMoveListening) {
        return;
      }

      event.preventDefault();

      this.pointerMoveListening = false;
      this.MoveOccur(Paint.NormalizePoint(event), event.button ?? 0);
      this.MoveComplete(this.pointerHasMoved, event.button ?? 0);
    };

    this.predictCanvas.onwheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        // Zoom in
        this.zoom.scale.modifier = Math.min(5, this.zoom.scale.modifier * 1.1);
      } else {
        // Zoom out is inverse of zoom in
        this.zoom.scale.modifier  = Math.max(0.1, this.zoom.scale.modifier * (1 / 1.1));
      }

      this.modes[this.currentMode].OnSettingsUpdate({
        darkModeEnabled: this.currentSettings.darkModeEnabled,
        color: this.currentSettings.color,
        width: this.zoomed(this.currentSettings.width),
        lazyEnabled: this.currentSettings.lazyEnabled,
        lazyMultiplier: this.currentSettings.lazyEnabled,
        tolerance: this.currentSettings.tolerance
      });

      // Set world origin
      this.zoom.scale.world.x = this.zoom.mouse.world.x;
      this.zoom.scale.world.y = this.zoom.mouse.world.y;

      // Set screen origin
      this.zoom.scale.screen.x = this.zoom.mouse.world.x;
      this.zoom.scale.screen.y = this.zoom.mouse.world.y;

      // Re-calc mouse world (real) pos
      this.zoom.mouse.world.x = this.zoomedInvX(this.zoom.mouse.screen.x);
      this.zoom.mouse.world.y = this.zoomedInvY(this.zoom.mouse.screen.y);

      console.log(this.zoom.scale.modifier);

      // Re-draw with rescaled coords
      this.ReDraw(true);
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

  // Just scale
  private zoomed(n: number): number {
    return Math.floor(n * this.zoom.scale.modifier);
  }

  // Converts from world coord to screen pixel coord
  private zoomedX(n: number): number {
    // scale & origin X
    return Math.floor((n - this.zoom.scale.world.x) * this.zoom.scale.modifier + this.zoom.scale.screen.x);
  }

  // Converts from world coord to screen pixel coord
  private zoomedY(n: number): number {
    // scale & origin Y
    return Math.floor((n - this.zoom.scale.world.y) * this.zoom.scale.modifier + this.zoom.scale.screen.y);
  }

  // Inverse does the reverse of a calculation. Like (3 - 1) * 5 = 10   the inverse is 10 * (1/5) + 1 = 3
  // multiply become 1 over ie *5 becomes * 1/5  (or just /5)
  // Adds become subtracts and subtract become add.
  // and what is first become last and the other way round.
  // inverse function converts from screen pixel coord to world coord
  private zoomedInvX(n: number): number {
    // scale & origin INV
    return Math.floor((n - this.zoom.scale.screen.x) * (1 / this.zoom.scale.modifier) + this.zoom.scale.world.x);
  }

  private zoomedInvY(n: number): number {
    // scale & origin INV
    return Math.floor((n - this.zoom.scale.screen.y) * (1 / this.zoom.scale.modifier) + this.zoom.scale.world.y);
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

  private MoveBegin(point: Float32Array, button: number): void {
    this.modes[this.currentMode].OnMoveBegin(point, button);
    // Save for frame request processing
    this.lastPointer = point;

    // Draw and calc only on frame request
    this.OnLazyUpdate();
  }

  private MoveOccur(point: Float32Array, button: number): void {
    this.modes[this.currentMode].OnMoveOccur(point, button);

    // Save for frame request processing
    this.lastPointer = point;
  }

  private MoveComplete(pointerHasMoved: boolean, button: number): void {
    const compiledObject = this.modes[this.currentMode].OnMoveComplete(pointerHasMoved, button);

    if (compiledObject instanceof FreeLine) {

      for (const point of compiledObject.points) {
        // Match to current scale
        point[0] = this.zoomedInvX(point[0]);
        point[1] = this.zoomedInvY(point[1]);
      }

      this.freeLines.push(compiledObject);
    } else if (compiledObject instanceof  StraightLine) {

      // Match to current scale
      compiledObject.start[0] = this.zoomedInvX(compiledObject.start[0]);
      compiledObject.start[1] = this.zoomedInvY(compiledObject.start[1]);

      compiledObject.stop[0] = this.zoomedInvX(compiledObject.stop[0]);
      compiledObject.stop[1] = this.zoomedInvY(compiledObject.stop[1]);

      this.straightLines.push(compiledObject);
    }

    delete this.lastPointer;
    window.cancelAnimationFrame(this.animFrameGlobID);
  }

  public ChangeMode(mode: string): void {
    this.currentMode = mode;
  }

  public Clear(): void {
    this.mainCanvasCTX.clear();
    this.predictCanvasCTX.clear();

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

  public ReDraw(zoomChanged: boolean = false): void {
    this.mainCanvasCTX.clear();
    this.predictCanvasCTX.clear();

    for (const line of this.freeLines) {

      if (!zoomChanged) {
        FreeLineMode.Reproduce(this.mainCanvasCTX, line);
        continue;
      }

      const scaled = [];
      line.points.map(point => {
        scaled.push(Float32Array.from([this.zoomedX(point[0]), this.zoomedY(point[1])]));
      });

      FreeLineMode.Reproduce(this.mainCanvasCTX, new FreeLine(line.color, this.zoomed(line.width), scaled));
    }

    for (const line of this.straightLines) {

      if (!zoomChanged) {
        StraightLineMode.Reproduce(this.mainCanvasCTX, line);
        continue;
      }

      const startScaled = new Float32Array([
        this.zoomedX(line.start[0]),
        this.zoomedY(line.start[1])
      ]);

      const stopScaled = new Float32Array([
        this.zoomedX(line.stop[0]),
        this.zoomedY(line.stop[1])
      ]);

      StraightLineMode.Reproduce(this.mainCanvasCTX, new StraightLine(line.color, this.zoomed(line.width), startScaled, stopScaled));
    }
  }

  public Redo(): void {

  }

  public Undo(): void {

  }
}
