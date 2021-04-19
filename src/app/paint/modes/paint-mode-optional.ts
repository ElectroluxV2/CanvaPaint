import { Protocol } from '../protocol/protocol';
import { SubMode } from './sub-mode';
import { CompiledObject } from '../compiled-objects/compiled-object';

export abstract class PaintModeOptional implements SubMode {
  /**
   * Contains sub modes, with keys corresponding to pointer types
   * If empty mode should override methods in PaintMode
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerType
   */
  protected subModes?: Map<string, SubMode>;

  /**
   * Method that reproduces object created by method's object
   *
   * @param canvas render destination
   * @param object object to render
   * @param color used to override color
   * @param width used to override width
   */
  public reproduceObject?(canvas: CanvasRenderingContext2D, object: CompiledObject, color?: string, width?: number): void;

  /**
   * Metod used in transportation
   * Should return string readable by read method
   */
  public serializeObject?(object: CompiledObject, builder?: Protocol.Builder): Protocol.Builder;

  /**
   * Method used in PDF export
   *
   * @param object target to export
   */
  public exportObjectSVG?(object: CompiledObject): string;

  /**
   * Metod used in transportation
   * Should return compiled object instance if not possible should return false
   */
  public readObject?(reader: Protocol.Reader): CompiledObject | boolean;

  /**
   * @inheritDoc
   */
  public onSelected(): void {
    if (!this.subModes?.values()) { return; }
    for (const subMode of this.subModes.values()) {
      subMode.onSelected?.();
    }
  }

  /**
   * @inheritDoc
   */
  public onUnSelected(): void {
    if (!this.subModes?.values()) { return; }
    for (const subMode of this.subModes.values()) {
      subMode.onUnSelected?.();
    }
  }

  /**
   * @inheritDoc
   */
  public makeReady(): void {
    if (!this.subModes?.values()) { return; }
    for (const subMode of this.subModes.values()) {
      subMode.makeReady?.();
    }
  }

  /**
   * @inheritDoc
   */
  public onFrameUpdate(): void {
    if (!this.subModes?.values()) { return; }
    // TODO: Fix firing for every mode, eg. use PaintManager.startFrameUpdate()
    for (const subMode of this.subModes.values()) {
      subMode.onFrameUpdate?.();
    }
  }

  /**
   * @inheritDoc
   */
  public onWheel(event: WheelEvent): void {
    this.subModes?.get('mouse')?.onWheel?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerOver(event: PointerEvent): void {
    this.subModes?.get(event.pointerType)?.onPointerOver?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerEnter(event: PointerEvent): void {
    this.subModes?.get(event.pointerType)?.onPointerEnter?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerDown(event: PointerEvent): void {
    this.subModes?.get(event.pointerType)?.onPointerDown?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerMove(event: PointerEvent): void {
    this.subModes?.get(event.pointerType)?.onPointerMove?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerUp(event: PointerEvent): void {
    this.subModes?.get(event.pointerType)?.onPointerUp?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerCancel(event: PointerEvent): void {
    this.subModes?.get(event.pointerType)?.onPointerCancel?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerOut(event: PointerEvent): void {
    this.subModes?.get(event.pointerType)?.onPointerOut?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerLeave(event: PointerEvent): void {
    this.subModes?.get(event.pointerType)?.onPointerLeave?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerGotCapture(event: PointerEvent): void {
    this.subModes?.get(event.pointerType)?.onPointerGotCapture?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerLostCapture(event: PointerEvent): void {
    this.subModes?.get(event.pointerType)?.onPointerLostCapture?.(event);
  }
}
