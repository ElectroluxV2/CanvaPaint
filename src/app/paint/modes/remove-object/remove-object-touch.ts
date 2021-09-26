import { SubMode } from '../sub-mode';
import { PaintManager } from '../../paint-manager';
import { NetworkManager } from '../../network-manager';
import { PaintMode } from '../paint-mode';

export class RemoveObjectTouch extends SubMode {
  constructor(parentMode: PaintMode, private predictCanvas: CanvasRenderingContext2D, private paintManager: PaintManager, private networkManager: NetworkManager) {
    super(parentMode);
  }

  public onPointerDown(event: PointerEvent): void {
    console.log('down touch');
  }

  public onPointerMove(event: PointerEvent): void {

  }

  public onFrameUpdate(): void {

  }

  public onPointerUp(event: PointerEvent): void {

  }
}
