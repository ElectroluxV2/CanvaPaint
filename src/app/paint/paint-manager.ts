import { CompiledObject } from './compiled-objects/compiled-object';
import { Point } from './protocol/point';
import { Reference } from './protocol/protocol';
import { PaintMode } from './modes/paint-mode';
import { ControlService } from './control.service';

export class PaintManager {
  /**
   * Contains all compiled compiled-objects
   * Object id is the key
   */
  public compiledObjectStorage: Map<string, CompiledObject> = new Map<string, CompiledObject>();
  /**
   * Contains single bit information on object grouped by information name
   */
  private objectsBits: Map<string, WeakMap<CompiledObject, boolean>> = new Map<string, WeakMap<CompiledObject, boolean>>();
  /**
   * Holds result of requestAnimationFrame
   */
  private animationFrameId: number;

  /**
   * Used to determinate if there is need to change color scheme and redraw everything
   */
  private darkModeEnabled = false;

  private lastSelectedObjectsCount = 0;

  constructor(private currentMode: Reference<PaintMode>, private modes: Map<string, PaintMode>, private mainCanvasCTX: CanvasRenderingContext2D, private selectionCanvasCTX: CanvasRenderingContext2D, private controlService: ControlService) {
    controlService.settings.subscribe(settings => {
      if (this.darkModeEnabled === settings.darkModeEnabled) {
        return;
      }

      this.darkModeEnabled = settings.darkModeEnabled;
      // Need to correct colors and redraw
      for (const object of this.compiledObjectStorage.values()) {
        object.color = controlService.correctColor(object.color);
      }

      this.redraw();
    });
  }

  public getSettings<T>(name: string): T {
    return this.controlService.settings.value[name];
  }

  /**
   * Starts animation loop
   */
  public startFrameUpdate(): void {
    // Start new loop, obtain new id
    this.currentMode.value?.onFrameUpdate?.();
    this.animationFrameId = window.requestAnimationFrame(this.startFrameUpdate.bind(this));
  }

  /**
   * Stops animation loop
   */
  public stopFrameUpdate(): void {
    window.cancelAnimationFrame(this.animationFrameId);
  }

  /**
   * Requests single frame update
   * Does not impact animation loop
   */
  public singleFrameUpdate(): void {
    window.requestAnimationFrame(() => {
      this.currentMode.value?.onFrameUpdate();
    });
  }

  /**
   * Saves compiled object
   * Draws compiled object
   *
   * @param object Object to save
   */
  public saveCompiledObject(object: CompiledObject): void {
    this.compiledObjectStorage.set(object.id, object);
    this.modes.get(object.name).reproduceObject(this.mainCanvasCTX, object);
  }

  public removeCompiledObject(id: string): boolean {
    return this.compiledObjectStorage.delete(id);
  }

  /**
   * @param point to normalize
   * @returns Normalized point.ts
   */
  public normalizePoint(point: Point): Point {
    // Make sure the point.ts does not go beyond the screen
    point[0] = point[0] > window.innerWidth ? window.innerWidth : point[0];
    point[0] = point[0] < 0 ? 0 : point[0];

    point[1] = point[1] > window.innerHeight ? window.innerHeight : point[1];
    point[1] = point[1] < 0 ? 0 : point[1];

    return point;
  }

  public clear(): void {
    this.compiledObjectStorage.clear();
  }

  public redraw(): void {
    this.mainCanvasCTX.clear();
    for (const object of this.compiledObjectStorage.values()) {
      this.modes.get(object.name).reproduceObject(this.mainCanvasCTX, object);
    }
  }

  public setObjectBit(object: CompiledObject, name: string, value: boolean): void {
    if (!this.objectsBits.has(name)) {
      this.objectsBits.set(name, new WeakMap<CompiledObject, boolean>());
    }

    this.objectsBits.get(name).set(object, value);
  }

  public redrawSelected(): void {
    const objectsToRedraw = [];
    for (const object of this.compiledObjectStorage.values()) {
      const selected = this.objectsBits.get('selected').get(object);
      if (!selected) { continue; }

      objectsToRedraw.push(object);
    }

    // No need to clear nor redraw
    if (this.lastSelectedObjectsCount === 0 && objectsToRedraw.length === 0) { return; }

    this.lastSelectedObjectsCount = objectsToRedraw.length;
    // Clear selection canvas
    this.selectionCanvasCTX.clear();
    // Reproduce on selection canvas
    for (const object of objectsToRedraw) {
      this.modes.get(object.name).reproduceObject(this.selectionCanvasCTX, object, '#673ab7');
    }
  }
}
