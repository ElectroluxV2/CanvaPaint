import { SubMode } from '../sub-mode';
import { PaintManager } from '../../paint-manager';
import { NetworkManager } from '../../network-manager';

export class RemoveObjectMouse implements SubMode {
  constructor(private predictCanvas: CanvasRenderingContext2D, private paintManager: PaintManager, private networkManager: NetworkManager) {
  }

  public onPointerDown(event: PointerEvent): void {
    console.log('down mouse');
  }

  public onPointerMove(event: PointerEvent): void {

  }

  public onFrameUpdate(): void {

  }

  public onPointerUp(event: PointerEvent): void {

  }
}
