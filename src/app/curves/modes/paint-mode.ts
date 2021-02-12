import { Settings } from '../../settings/settings.interface';

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
   * Fired when the user rotates a wheel button on a pointing device (typically a mouse).
   */
  abstract OnWheel(event: WheelEvent): void;

  /**
   * Fired when a pointer is moved into an element's hit test boundaries.
   */
  abstract OnPointerOver(event: PointerEvent): void;

  /**
   * Fired when a pointer is moved into the hit test boundaries of an element or one of its descendants,
   * including as a result of a pointerdown event from a device that does not support hover (see pointerdown).
   */
  abstract OnPointerEnter(event: PointerEvent): void;

  /**
   * Fired when a pointer becomes active buttons state.
   */
  abstract OnPointerDown(event: PointerEvent): void;

  /**
   * Fired when a pointer changes coordinates. This event is also used if the change in pointer state can not be reported by other events.
   */
  abstract OnPointerMove(event: PointerEvent): void;

  /**
   * Fired when a pointer is no longer active buttons state.
   */
  abstract OnPointerUp(event: PointerEvent): void;

  /**
   * A browser fires this event if it concludes the pointer will no longer be able to generate events (for example the related device is deactivated).
   */
  abstract OnPointerCancel(event: PointerEvent): void;

  /**
   * Fired for several reasons including: pointer is moved out of the hit test boundaries of an element;
   * firing the pointerup event for a device that does not support hover (see pointerup);
   * after firing the pointercancel event (see pointercancel);
   * when a pen stylus leaves the hover range detectable by the digitizer.
   */
  abstract OnPointerOut(event: PointerEvent): void;

  /**
   * Fired when a pointer is moved out of the hit test boundaries of an element.
   * For pen devices, this event is fired when the stylus leaves the hover range detectable by the digitizer.
   */
  abstract OnPointerLeave(event: PointerEvent): void;

  /**
   * Fired when an element receives pointer capture.
   */
  abstract OnPointerGotCapture(event: PointerEvent): void;

  /**
   * Fired after pointer capture is released for a pointer.
   */
  abstract OnPointerLostCapture(event: PointerEvent): void;

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
