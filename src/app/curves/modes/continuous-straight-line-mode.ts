import { CompiledObject, PaintMode } from './paint-mode';

export class ContinuousStraightLineMode extends PaintMode {
  readonly name = 'continuous-line';
  public ReproduceObject(canvas: CanvasRenderingContext2D, object: CompiledObject): void {

  }

  public SerializeObject(object: CompiledObject): string {
    return '';
  }

  public ReadObject(object: CompiledObject): boolean {
    return false;
  }
}
