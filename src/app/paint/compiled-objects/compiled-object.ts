import { Point } from '../protocol/point';

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
   * Unique identifier
   */
  readonly #id: string;
  /**
   * Color
   */
  color: string;
  /**
   * Width
   */
  width: number;

  constructor(id: string, name: string) {
    this.#id = id;
    this.#name = name;
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

  get name() {
    return this.#name;
  }

  get id() {
    return this.#id;
  }
}
