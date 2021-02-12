import { Settings } from '../../settings/settings.interface';
import { FreeLine } from './free-line-mode';
import { StraightLine } from './straight-line-mode';

/**
 * Represents object that contains minimalistic data on how to draw it onto canvas
 */
export interface CompiledObject {
  /**
   * Has to be unique, used for storing in map as key
   */
  name: string;
  /**
   * ID of client who created this object
   */
  owner?: number;
}

export abstract class PaintMode {
  /**
   * Canvas treated as helper, used e.g. to draw control dots. WARNING This canvas may and probably will be cleared by mode
   */
  protected readonly predictCanvas: CanvasRenderingContext2D;

  /**
   * This Canvas should be never cleared by mode, used to draw compiled object
   */
  protected readonly mainCanvas: CanvasRenderingContext2D;

  /**
   * Current settings
   * @see Settings
   */
  protected settings: Settings;

  /**
   * Induced at every frame (depended on user's device), controlled by StartFrameUpdate() and StopFrameUpdate()
   * @see https://developer.mozilla.org/pl/docs/Web/API/Window/requestAnimationFrame requestAnimationFrame
   */
  abstract OnFrameUpdate(): void;

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
  abstract OnMoveOccur(point: Uint32Array, button: number): void;

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
   * Induced every time event is fired and only when mode was selected at event fire time
   * Possible events:
   * - user clears screen,
   * - redraw,
   * - rescale,
   */
  abstract MakeReady(): void;

  /**
   * @param predictCanvas Canvas treated as helper, used e.g. to draw control dots. WARNING This canvas may and probably will be cleared by mode
   * @param mainCanvas This Canvas should be never cleared by mode, used to draw compiled object
   * @param settings Current settings
   */
  constructor(predictCanvas: CanvasRenderingContext2D, mainCanvas: CanvasRenderingContext2D, settings: Settings) {
    this.predictCanvas = predictCanvas;
    this.mainCanvas = mainCanvas;
    this.settings = settings;
  }
}
