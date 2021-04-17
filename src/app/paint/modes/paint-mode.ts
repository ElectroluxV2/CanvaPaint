import { PaintManager } from '../paint-manager';
import { NetworkManager } from '../network-manager';
import { PaintModeOptional } from './paint-mode-optional';

export abstract class PaintMode extends PaintModeOptional {
  /**
   * Has to be unique, used for storing in map as key, must match exported object name
   * must return only 1 match with regex /([A-z]+([A-z]|-|[0-9])+)/g
   */
  public readonly name: string;

  /**
   * Contains Paint's methods
   */
  protected readonly paintManager: PaintManager;

  /**
   * Contains network methods
   */
  protected readonly networkManager: NetworkManager;

  /**
   * Canvas treated as helper, used e.g. to draw control dots. WARNING This canvas may and probably will be cleared by mode
   */
  protected readonly predictCanvas: CanvasRenderingContext2D;

  /**
   * @param predictCanvas Canvas treated as helper, used e.g. to draw control dots. WARNING This canvas may and probably will be cleared by mode
   * @param paintManager Paint manager
   * @param networkManager Network manager
   */
  protected constructor(predictCanvas: CanvasRenderingContext2D, paintManager: PaintManager, networkManager: NetworkManager) {
    super();
    this.predictCanvas = predictCanvas;
    this.paintManager = paintManager;
    this.networkManager = networkManager;
  }
}
