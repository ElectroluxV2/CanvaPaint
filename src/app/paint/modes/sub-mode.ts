import { PaintMode } from './paint-mode';

export class SubMode {
  /**
   * Reference to parent mode (PaintMode)
   */
  readonly #parentMode: PaintMode;

  constructor(parentMode: PaintMode) {
    this.#parentMode = parentMode;
  }

  /**
   * Induced every time mode is selected
   */
  onSelected?(): void;

  /**
   * Induced every time mode is unselected
   */
  onUnSelected?(): void;

  /**
   * Induced every time event is fired and only when mode was selected at event fire time
   * Possible events:
   * - user clears screen,
   * - redraw,
   * - rescale,
   */
  makeReady?(): void;

  /**
   * Induced at every frame (depended on user's device), controlled by StartFrameUpdate() and StopFrameUpdate()
   *
   * @see https://developer.mozilla.org/pl/docs/Web/API/Window/requestAnimationFrame requestAnimationFrame
   */
  onFrameUpdate?(): void;

  /**
   * Fired when the user rotates a wheel button on a pointing device (typically a mouse).
   */
  onWheel?(event: WheelEvent): void;

  /**
   * Fired when a pointer is moved into an element's hit test boundaries.
   */
  onPointerOver?(event: PointerEvent): void;

  /**
   * Fired when a pointer is moved into the hit test boundaries of an element or one of its descendants,
   * including as a result of a pointerdown event from a device that does not support hover (see pointerdown).
   */
  onPointerEnter?(event: PointerEvent): void;

  /**
   * Fired when a pointer becomes active buttons state.
   */
  onPointerDown?(event: PointerEvent): void;

  /**
   * Fired when a pointer changes coordinates. This event is also used if the change in pointer state can not be reported by other events.
   * In Chrome, pointermove is actually supposed to align/throttle to requestAnimationFrame automatically,
   * but there is a bug where it behaves differently with Dev Tools open.
   */
  onPointerMove?(event: PointerEvent): void;

  /**
   * Fired when a pointer is no longer active buttons state.
   */
  onPointerUp?(event: PointerEvent): void;

  /**
   * A browser fires this event if it concludes the pointer will no longer be able to generate events (for example the related device is deactivated).
   */
  onPointerCancel?(event: PointerEvent): void;

  /**
   * Fired for several reasons including: pointer is moved out of the hit test boundaries of an element;
   * firing the pointerup event for a device that does not support hover (see pointerup);
   * after firing the pointercancel event (see pointercancel);
   * when a pen stylus leaves the hover range detectable by the digitizer.
   */
  onPointerOut?(event: PointerEvent): void;

  /**
   * Fired when a pointer is moved out of the hit test boundaries of an element.
   * For pen devices, this event is fired when the stylus leaves the hover range detectable by the digitizer.
   */
  onPointerLeave?(event: PointerEvent): void;

  /**
   * Fired when an element receives pointer capture.
   */
  onPointerGotCapture?(event: PointerEvent): void;

  /**
   * Fired after pointer capture is released for a pointer.
   */
  onPointerLostCapture?(event: PointerEvent): void;

  get parentMode() {
    return this.#parentMode;
  }
}
