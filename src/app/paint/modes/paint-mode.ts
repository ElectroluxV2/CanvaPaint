import { PaintManager } from '../managers/paint-manager';
import { NetworkManager } from '../managers/network-manager';
import { PaintModeOptional } from './paint-mode-optional';

export abstract class PaintMode extends PaintModeOptional {
  /**
   * Has to be unique, used for storing in map as key, must match exported object name
   * must return only 1 match with regex /[a-zA-Z0-9-]+/g
   */
  readonly #name: string;

  /**
   * Contains Paint's methods
   */
  readonly #paintManager: PaintManager;

  /**
   * Contains network methods
   */
  readonly #networkManager: NetworkManager;

  /**
   * Canvas treated as helper, used e.g. to draw control dots. WARNING This canvas may and probably will be cleared by mode
   */
  readonly #predictCanvasCTX: CanvasRenderingContext2D;

  /**
   * @param name Name of mode
   * @param predictCanvasCTX Canvas treated as helper, used e.g. to draw control dots. WARNING This canvas may and probably will be cleared by mode
   * @param paintManager Paint manager
   * @param networkManager Network manager
   */
  protected constructor(name: string, predictCanvasCTX: CanvasRenderingContext2D, paintManager: PaintManager, networkManager: NetworkManager) {
    super(null);
    this.#name = name;
    this.#predictCanvasCTX = predictCanvasCTX;
    this.#paintManager = paintManager;
    this.#networkManager = networkManager;
  }

  /**
   * Has to be unique, used for storing in map as key, must match exported object name
   * must return only 1 match with regex /[a-zA-Z0-9-]+/g
   */
  get name() {
    return this.#name;
  }

  get paintManager() {
    return this.#paintManager;
  }

  get networkManager() {
    return this.#networkManager;
  }

  get predictCanvasCTX() {
    return this.#predictCanvasCTX;
  }
}
