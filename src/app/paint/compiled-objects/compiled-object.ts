import { Point } from '../protocol/point';
import { PaintMode } from '../modes/paint-mode';
import { Protocol } from '../protocol/protocol';
import Reader = Protocol.Reader;

/**
 * Represents object that contains minimalistic data on how to draw it onto canvas
 */
export class CompiledObject {
  /**
   * Has to be unique, used for storing in map as key, must match mode name
   * must return only 1 match with regex /([A-z]+([A-z]|-|[0-9])+)/g
   */
  readonly #name: string;
  /**
   * Parent Mode that created this object
   */
  readonly #paintMode: PaintMode;
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Color
   */
  color: string;
  /**
   * Width
   */
  width: number;

  constructor(paintMode: PaintMode, id: string) {
    this.#paintMode = paintMode;
    this.#name = paintMode.name;
    this.id = id;
  }

  /**
   * Should return true if pointer is inside object
   *
   * @param ctx canvas context
   * @param pointer point in canvas
   */
  isSelectedBy(ctx: CanvasRenderingContext2D, pointer: Point): boolean {
    throw new Error(`isSelectedBy not implemented!`);
  }

  serialize() {
    return this.paintMode.serializeObject(this).toString();
  }

  read(data: string) {
    const reader = new Reader(data);
    return this.paintMode.readObject(reader);
  }

  get name() {
    return this.#name;
  }

  get paintMode() {
    return this.#paintMode;
  }
}
