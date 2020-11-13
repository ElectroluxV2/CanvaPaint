import { PaintMode } from './paint-mode';
import { CardinalSpline } from '../cardinal-spline';
import { LazyBrush } from '../lazy-brush';
import {PaintSettings} from '../../paint';

export class FreeLineMode extends PaintMode {

  private freeLineOccurringNow = false;
  private currentSpline: CardinalSpline;
  private currentLazyBrush: LazyBrush;

  OnLazyUpdate(lastPointer: Float32Array): void {

    if (!this.currentSpline) { return; }
    if (!this.currentLazyBrush) { return; }

    this.currentLazyBrush.Update(lastPointer);

    // Same redraw prevention
    if (!this.currentLazyBrush.HasMoved && !this.currentSpline.IsEmpty) { return; }

    // TODO: Networking staff
    const compiled = this.currentSpline.AddPoint(this.currentLazyBrush.Get());
  }

  OnMoveBegin(): void {
    this.freeLineOccurringNow = true;
  }

  OnMoveOccur(point: Float32Array): void {
    if (!this.freeLineOccurringNow) { return; }

    if (!this.currentSpline) {
      // For realtime processing
      // TODO: Settings
      this.currentSpline = new CardinalSpline(this.mainCanvas, this.predictCanvas, 1, this.settings.width, this.settings.color);
    }

    if (!this.currentLazyBrush) {
      // Make radius 1% of screen width nor height
      // TODO: Settings
      const w10 = this.predictCanvas.canvas.width * 0.01;
      const h10 = this.predictCanvas.canvas.height * 0.01;

      // Draw stabilizer
      this.currentLazyBrush = new LazyBrush(Math.max(w10, h10), point);
    }
  }

  OnMoveComplete(): void {
    // TODO: Networking staff
    const compiled = this.currentSpline.Finish();

    // Cleanup
    delete this.currentSpline;
    delete this.currentLazyBrush;
  }

  OnSettingsUpdate(settings: PaintSettings) {
    super.OnSettingsUpdate(settings);

    if (!this.currentSpline) { return; }

    this.currentSpline.Color = settings.color;
    this.currentSpline.Width = settings.width;
  }


}
