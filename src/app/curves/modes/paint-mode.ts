import { Settings } from '../../settings/settings.interface';
import { FreeLine } from './free-line-mode';
import { StraightLine } from './straight-line-mode';

export abstract class PaintMode {
  protected readonly predictCanvas: CanvasRenderingContext2D;
  protected readonly mainCanvas: CanvasRenderingContext2D;
  protected settings: Settings;
  protected lastPointer: Uint32Array;

  /**
   * Induced at every frame (depended on user's)
   * @param lastPointer contains pointer location at draw moment
   */
  abstract OnLazyUpdate(lastPointer: Uint32Array): void;

  /**
   * Induced once per move
   * @param point contains pointer location at begin moment
   * @param button contains button id if not available equals 0
   */
  abstract OnMoveBegin(point: Uint32Array, button: number): void;

  /**
   * Induced every move event
   * @param point contains pointer location at move moment
   * @param button contains button id if not available equals 0
   */
  public OnMoveOccur(point: Uint32Array, button: number): void {
    this.lastPointer = point;
  }

  /**
   * Induced once per move
   * @param pointerHasMoved true if pointer has moved from position captured at @OnMoveBegin
   * @param button contains button id if not available equals 0
   * @return object
   */
  abstract OnMoveComplete(pointerHasMoved: boolean, button: number): FreeLine | StraightLine;

  /**
   * Induced every time settings changed
   * @param settings updated settings
   */
  public OnSettingsUpdate(settings: Settings): void {
    this.settings = settings;
  }

  /**
   * Induced every time mode is selected
   */
  abstract OnSelected(): void;

  /**
   * Induced every time user clears screen and only when mode was selected at the clearing time
   */
  abstract OnClear(): void;

  constructor(predictCanvas: CanvasRenderingContext2D, mainCanvas: CanvasRenderingContext2D, settings: Settings) {
    this.predictCanvas = predictCanvas;
    this.mainCanvas = mainCanvas;
    this.settings = settings;
  }
}
