import { PaintMode } from './paint-mode';
import { Settings } from '../../settings/settings.interface';

export class ContinuousStraightLineMode extends PaintMode {

  public static Reproduce(canvas: CanvasRenderingContext2D, compiled: any): void {

  }

  public OnMoveBegin(point: Float32Array): void {

  }

  public OnLazyUpdate(lastPointer: Float32Array): void {

  }

  public OnMoveComplete(): any {

    return null;
  }

  public OnSettingsUpdate(settings: Settings): void {
    super.OnSettingsUpdate(settings);
  }
}
