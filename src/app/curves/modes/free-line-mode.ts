import { PaintMode } from './paint-mode';
import { CardinalSpline } from '../cardinal-spline';
import { LazyBrush } from '../lazy-brush';
import { PaintSettings } from '../../paint';

export class FreeLineMode extends PaintMode {

  private freeLineOccurringNow = false;
  private currentSpline: CardinalSpline;
  private currentLazyBrush: LazyBrush;

  OnMoveBegin(point: Float32Array): void {
    this.freeLineOccurringNow = true;

    // For realtime processing
    // TODO: Settings
    this.currentSpline = new CardinalSpline(this.mainCanvas, this.predictCanvas, 1, this.settings.width, this.settings.color);

    // TODO: Settings
    // Draw stabilizer
    this.currentLazyBrush = new LazyBrush(150, point);
  }

  OnMoveOccur(point: Float32Array): void {
    if (!this.freeLineOccurringNow) { return; }
  }

  OnLazyUpdate(lastPointer: Float32Array): void {

    if (!this.currentSpline) { return; }
    if (!this.currentLazyBrush) { return; }

    this.currentLazyBrush.Update(lastPointer);

    if (this.currentSpline.IsEmpty) {
      // Force update first time
      this.currentLazyBrush.ForceBrush(lastPointer);
    }

    // Same redraw prevention
    if (!this.currentLazyBrush.HasMoved) { return; }

    // TODO: Networking staff
    const compiled = this.currentSpline.AddPoint(this.currentLazyBrush.Get());
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
