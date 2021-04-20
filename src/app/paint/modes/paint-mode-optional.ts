import { Protocol } from '../protocol/protocol';
import { SubMode } from './sub-mode';
import { CompiledObject } from '../compiled-objects/compiled-object';
import { PDFPage } from 'pdf-lib';

export abstract class PaintModeOptional implements SubMode {
  /**
   * Contains sub modes, with keys corresponding to pointer types
   * If empty mode should override methods in PaintMode
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerType
   */
  protected subModes?: Map<string, SubMode>;

  /**
   * Used to select which mode is currently used
   */
  protected lastSubMode?: SubMode;

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
  public drawObjectOnPDFPage?(object: CompiledObject, page: PDFPage): void;

  /**
   * Metod used in transportation
   * Should return compiled object instance if not possible should return false
   */
  public readObject?(reader: Protocol.Reader): CompiledObject | boolean;

  /**
   * @inheritDoc
   */
  public onSelected(): void {
    if (!this.lastSubMode) { return; }
    this.lastSubMode.onSelected?.();
  }

  /**
   * @inheritDoc
   */
  public onUnSelected(): void {
    if (!this.lastSubMode) { return; }
    this.lastSubMode.onUnSelected?.();
  }

  /**
   * @inheritDoc
   */
  public makeReady(): void {
    if (!this.lastSubMode) { return; }
    this.lastSubMode.makeReady?.();
  }

  /**
   * @inheritDoc
   */
  public onFrameUpdate(): void {
    if (!this.lastSubMode) { return; }
    this.lastSubMode.onFrameUpdate?.();
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
    if (!this.subModes) { return; }
    this.lastSubMode = this.subModes.get(event.pointerType);
    this.lastSubMode?.onPointerOver?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerEnter(event: PointerEvent): void {
    if (!this.subModes) { return; }
    this.lastSubMode = this.subModes.get(event.pointerType);
    this.lastSubMode?.onPointerEnter?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerDown(event: PointerEvent): void {
    if (!this.subModes) { return; }
    this.lastSubMode = this.subModes.get(event.pointerType);
    this.lastSubMode?.onPointerDown?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerMove(event: PointerEvent): void {
    if (!this.subModes) { return; }
    this.lastSubMode = this.subModes.get(event.pointerType);
    this.lastSubMode?.onPointerMove?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerUp(event: PointerEvent): void {
    if (!this.subModes) { return; }
    this.lastSubMode = this.subModes.get(event.pointerType);
    this.lastSubMode?.onPointerUp?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerCancel(event: PointerEvent): void {
    if (!this.subModes) { return; }
    this.lastSubMode = this.subModes.get(event.pointerType);
    this.lastSubMode?.onPointerCancel?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerOut(event: PointerEvent): void {
    if (!this.subModes) { return; }
    this.lastSubMode = this.subModes.get(event.pointerType);
    this.lastSubMode?.onPointerOut?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerLeave(event: PointerEvent): void {
    if (!this.subModes) { return; }
    this.lastSubMode = this.subModes.get(event.pointerType);
    this.lastSubMode?.onPointerLeave?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerGotCapture(event: PointerEvent): void {
    if (!this.subModes) { return; }
    this.lastSubMode = this.subModes.get(event.pointerType);
    this.lastSubMode?.onPointerGotCapture?.(event);
  }

  /**
   * @inheritDoc
   */
  public onPointerLostCapture(event: PointerEvent): void {
    if (!this.subModes) { return; }
    this.lastSubMode = this.subModes.get(event.pointerType);
    this.lastSubMode?.onPointerLostCapture?.(event);
  }
}
