import { Point } from './point';

export interface Box {
  p0: Point;
  p1: Point;
}

/**
 * Represents object that contains minimalistic data on how to draw it onto canvas
 */
export interface CompiledObject {
  /**
   * Has to be unique, used for storing in map as key, must match mode name
   * must return only 1 match with regex /([A-z]+([A-z]|-|[0-9])+)/g
   */
  name: string;
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Color
   */
  color: string;
  /**
   * Hit box
   */
  box?: Box;
}
