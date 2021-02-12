import { Paint } from './paint';
import { NgZone } from '@angular/core';
import { SettingsService } from '../settings/settings.service';
import { CompiledObject } from '../curves/modes/paint-mode';

export class PublicApi {
  /**
   * Holds instance of paint
   */
  private static paint: Paint;

  /**
   * Angular's zone
   */
  private static ngZone: NgZone;

  /**
   * Holds result of requestAnimationFrame
   */
  private static animationFrameId: number;

  /**
   * Creates new Instance of Paint
   * @param ngZone TODO
   * @param mainCanvas TODO
   * @param predictCanvas TODO
   * @param settingsService TODO
   * @returns New Paint instance
   */
  public static Create(ngZone: NgZone, mainCanvas: HTMLCanvasElement, predictCanvas: HTMLCanvasElement, settingsService: SettingsService): Paint {
    this.ngZone = ngZone;
    this.paint = new Paint(ngZone, mainCanvas, predictCanvas, settingsService);
    return this.paint;
  }

  /**
   * Starts animation loop
   */
  public static StartFrameUpdate(): void {
    // Start new loop, obtain new id
    this.ngZone.runOutsideAngular(() => {
      this.paint?.OnFrameUpdate();
      this.animationFrameId = window.requestAnimationFrame(this.StartFrameUpdate.bind(this));
    });
  }

  /**
   * Stops animation loop
   */
  public static StopFrameUpdate(): void {
    window.cancelAnimationFrame(this.animationFrameId);
  }

  /**
   * Saves compiled object
   * @param object Object to save
   */
  public static SaveCompiledObject(object: CompiledObject): void {
    if (!this.paint.compiledObjectStorage.has(object.name)) {
      this.paint.compiledObjectStorage.set(object.name, []);
    }

    this.paint.compiledObjectStorage.get(object.name).push(object);
  }

  /**
   * @param point to normalize
   * @returns Normalized point
   */
  private static NormalizePoint(point: Uint32Array): Uint32Array {
    // Make sure the point does not go beyond the screen
    point[0] = point[0] > window.innerWidth ? window.innerWidth : point[0];
    point[0] = point[0] < 0 ? 0 : point[0];

    point[1] = point[1] > window.innerHeight ? window.innerHeight : point[1];
    point[1] = point[1] < 0 ? 0 : point[1];

    point[0] *= window.devicePixelRatio;
    point[1] *= window.devicePixelRatio;

    return point;
  }

  /**
   * Draws dot onto predict canvas
   * @param position position of control dot
   * @param width width of control dot
   * @param color color of control dot
   */
  public static DrawControlDot(position: Uint32Array, width: number, color: string): void {
    this.paint.predictCanvasCTX.beginPath();
    this.paint.predictCanvasCTX.arc(
      position[0],
      position[1],
      width / Math.PI,
      0,
      2 * Math.PI,
      false
    );
    this.paint.predictCanvasCTX.fillStyle = color;
    this.paint.predictCanvasCTX.fill();
  }

}
