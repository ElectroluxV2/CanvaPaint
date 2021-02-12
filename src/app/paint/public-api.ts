import { Paint } from './paint';
import { NgZone } from '@angular/core';
import { SettingsService } from '../settings/settings.service';

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
   */
  public static Create(ngZone: NgZone, mainCanvas: HTMLCanvasElement, predictCanvas: HTMLCanvasElement, settingsService: SettingsService): void {
    this.ngZone = ngZone;
    this.paint = new Paint(ngZone, mainCanvas, predictCanvas, settingsService);
  }

  /**
   * Starts animation loop if not already started
   */
  public static StartFrameUpdate(): void {
    if (!!this.animationFrameId) {
      // Already started
      return;
    }

    // Start new loop, obtain new id
    this.ngZone.runOutsideAngular(() => {
      this.animationFrameId = window.requestAnimationFrame(this.OnFrameUpdate.bind(this));
    });
  }

  /**
   * Stops animation loop
   */
  public static StopFrameUpdate(): void {
    window.cancelAnimationFrame(this.animationFrameId);
  }

  private static OnFrameUpdate(): void {

  }
}
