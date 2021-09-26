import { SubMode } from '../sub-mode';
import { PaintManager } from '../../paint-manager';
import { NetworkManager } from '../../network-manager';
import { PaintMode } from '../paint-mode';

export class ContinuousStraightLineModePen extends SubMode {
  constructor(parentMode: PaintMode, private predictCanvas: CanvasRenderingContext2D, private paintManager: PaintManager, private networkManager: NetworkManager) {
    super(parentMode);
  }

  public onPointerDown(event: PointerEvent): void {
    console.log('down pen');
  }

  public onPointerMove(event: PointerEvent): void {

  }

  public onFrameUpdate(): void {

  }

  public onPointerUp(event: PointerEvent): void {

  }
}
