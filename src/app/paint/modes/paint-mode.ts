import { Settings } from '../../settings/settings.interface';
import { CompiledObject } from '../protocol/compiled-object';
import { Protocol } from '../protocol/protocol';
import { PaintManager } from '../paint-manager';
import { NetworkManager } from '../network-manager';

abstract class PaintModeOptional {
  /**
   * Induced every time mode is selected
   */
  public onSelected?(): void;

  /**
   * Induced every time mode is unselected
   */
  public onUnSelected?(): void;

  /**
   * Induced every time event is fired and only when mode was selected at event fire time
   * Possible events:
   * - user clears screen,
   * - redraw,
   * - rescale,
   */
  public makeReady?(): void;

  /**
   * Fired when the user rotates a wheel button on a pointing device (typically a mouse).
   */
  public onWheel?(event: WheelEvent): void;

  /**
   * Fired when a pointer is moved into an element's hit test boundaries.
   */
  public onPointerOver?(event: PointerEvent): void;

  /**
   * Fired when a pointer is moved into the hit test boundaries of an element or one of its descendants,
   * including as a result of a pointerdown event from a device that does not support hover (see pointerdown).
   */
  public onPointerEnter?(event: PointerEvent): void;

  /**
   * Fired when a pointer becomes active buttons state.
   */
  public onPointerDown?(event: PointerEvent): void;

  /**
   * Fired when a pointer changes coordinates. This event is also used if the change in pointer state can not be reported by other events.
   * In Chrome, pointermove is actually supposed to align/throttle to requestAnimationFrame automatically,
   * but there is a bug where it behaves differently with Dev Tools open.
   */
  public onPointerMove?(event: PointerEvent): void;

  /**
   * Fired when a pointer is no longer active buttons state.
   */
  public onPointerUp?(event: PointerEvent): void;

  /**
   * A browser fires this event if it concludes the pointer will no longer be able to generate events (for example the related device is deactivated).
   */
  public onPointerCancel?(event: PointerEvent): void;

  /**
   * Fired for several reasons including: pointer is moved out of the hit test boundaries of an element;
   * firing the pointerup event for a device that does not support hover (see pointerup);
   * after firing the pointercancel event (see pointercancel);
   * when a pen stylus leaves the hover range detectable by the digitizer.
   */
  public onPointerOut?(event: PointerEvent): void;

  /**
   * Fired when a pointer is moved out of the hit test boundaries of an element.
   * For pen devices, this event is fired when the stylus leaves the hover range detectable by the digitizer.
   */
  public onPointerLeave?(event: PointerEvent): void;

  /**
   * Fired when an element receives pointer capture.
   */
  public onPointerGotCapture?(event: PointerEvent): void;

  /**
   * Fired after pointer capture is released for a pointer.
   */
  public onPointerLostCapture?(event: PointerEvent): void;

  /**
   * Induced every time settings changed
   *
   * @param settings updated settings
   */
  public onSettingsUpdate?(settings: Settings): void;

  /**
   * Induced at every frame (depended on user's device), controlled by StartFrameUpdate() and StopFrameUpdate()
   *
   * @see https://developer.mozilla.org/pl/docs/Web/API/Window/requestAnimationFrame requestAnimationFrame
   */
  public onFrameUpdate?(): void;

  /**
   * Method that reproduces object created by method's object
   *
   * @param canvas render destination
   * @param object object to render
   */
  public reproduceObject?(canvas: CanvasRenderingContext2D, object: CompiledObject): void;

  /**
   * Metod used in transportation
   * Should return string readable by read method
   */
  public serializeObject?(object: CompiledObject, builder?: Protocol.Builder): Protocol.Builder;

  /**
   * Metod used in transportation
   * Should return compiled object instance if not possible should return false
   */
  public readObject?(reader: Protocol.Reader): CompiledObject | boolean;
}

export abstract class PaintMode extends PaintModeOptional {
  /**
   * Has to be unique, used for storing in map as key, must match exported object name
   * must return only 1 match with regex /([A-z]+([A-z]|-|[0-9])+)/g
   */
  readonly name: string;
  /**
   * Contains Paint's methods
   */
  readonly paintManager: PaintManager;
  /**
   * Contains network methods
   */
  readonly networkManager: NetworkManager;
  /**
   * Canvas treated as helper, used e.g. to draw control dots. WARNING This canvas may and probably will be cleared by mode
   */
  readonly predictCanvas: CanvasRenderingContext2D;

  /**
   * Current settings
   *
   * @see Settings
   */
  protected settings: Settings;

  /**
   * @param predictCanvas Canvas treated as helper, used e.g. to draw control dots. WARNING This canvas may and probably will be cleared by mode
   * @param paintManager Paint manager
   * @param networkManager Network
   * @param settings Current settings
   */
  constructor(predictCanvas: CanvasRenderingContext2D, paintManager: PaintManager, networkManager: NetworkManager, settings: Settings) {
    super();
    this.predictCanvas = predictCanvas;
    this.paintManager = paintManager;
    this.networkManager = networkManager;
    this.settings = settings;
  }

  // Default
  public onSettingsUpdate(settings: Settings): void {
    this.settings = settings;
  }
}
