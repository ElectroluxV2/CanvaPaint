import { CompiledObject } from './protocol/compiled-object';
import { Point } from './protocol/point';
import { PaintMode } from './modes/paint-mode';
import { Reference } from './protocol/protocol';

export class PaintManager {
  /**
   * Contains all compiled objects
   */
  public compiledObjectStorage: Map<string, Array<CompiledObject>> = new Map<string, []>();
  /**
   * Holds result of requestAnimationFrame
   */
  private animationFrameId: number;

  constructor(private currentMode: Reference<PaintMode>, private modes: Map<string, PaintMode>, private mainCanvasCTX: CanvasRenderingContext2D) { }

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
    if (!this.compiledObjectStorage.has(object.name)) {
      this.compiledObjectStorage.set(object.name, []);
    }

    this.compiledObjectStorage.get(object.name).push(object);
    this.modes.get(object.name).reproduceObject(this.mainCanvasCTX, object);
  }

  public removeCompiledObject(id: string): void {
    this.compiledObjectStorage.delete(id);
    this.redraw();
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
    for (const [name, objects] of this.compiledObjectStorage) {
      for (const compiledObject of objects) {
        this.modes.get(name).reproduceObject(this.mainCanvasCTX, compiledObject);
      }
    }
  }
}
