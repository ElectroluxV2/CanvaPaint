import { FreeLine } from './free-line-mode';
import {CompiledObject, PaintMode} from './paint-mode';
import {StraightLine} from './straight-line-mode';

export class ContinuousStraightLineMode extends PaintMode {
  readonly name = 'continuous-straight-line';

  public ReproduceObject(canvas: CanvasRenderingContext2D, object: CompiledObject): void {

  }

  public SerializeObject(object: CompiledObject): string {
    return '';
  }

  public ReadObject(data: string): boolean {
    return false;
  }

  public OnLazyUpdate(lastPointer: Uint32Array): void {
      throw new Error('Method not implemented.');
  }

  public OnMoveBegin(point: Uint32Array, button: number): void {
      throw new Error('Method not implemented.');
  }

  public OnMoveComplete(pointerHasMoved: boolean, button: number): FreeLine | StraightLine {
      throw new Error('Method not implemented.');
  }

  public OnSelected(): void {
      throw new Error('Method not implemented.');
  }

  public MakeReady(): void {
      throw new Error('Method not implemented.');
  }
}
