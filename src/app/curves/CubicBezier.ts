/**
 * Copyright (c) 2020 Mateusz Budzisz
 * Copyright (c) 2015 burningmime
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgement in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */

import { Vector } from 'vector2d';

/**
 * Cubic Bezier curve in 2D consisting of 4 control points.
 */
export class CubicBezier {
  public readonly p0: Vector;
  public readonly p1: Vector;
  public readonly p2: Vector;
  public readonly p3: Vector;

  /**
   * Creates a new cubic bezier using the given control points.
   * @param p0 control point 0
   * @param p1 control point 1
   * @param p2 control point 2
   * @param p3 control point 3
   */
  constructor(p0: Vector, p1: Vector, p2: Vector, p3: Vector) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }

  /**
   * Samples the bezier curve at the given t value.
   * @param t Time value at which to sample (should be between 0 and 1, though it won't fail if outside that range).
   * @return Sampled point.
   */
  public Sample(t: number): Vector {
    const ti = 1 - t;
    const t0 = ti * ti * ti;
    const t1 = 3 * ti * ti * t;
    const t2 = 3 * ti * t * t;
    const t3 = t * t * t;

    return (
      this.p0.mulS(t0)
    ).add(
      this.p1.mulS(t1)
    ).add(
      this.p2.mulS(t2)
    ).add(
      this.p3.mulS(t3)
    );
  }

  /**
   * Gets the first derivative of the curve at the given T value.
   * @param t Time value at which to sample (should be between 0 and 1, though it won't fail if outside that range).
   * @return First derivative of curve at sampled point.
   */
  public Derivative(t: number): Vector {
    const ti = 1 - t;
    const tp0 = 3 * ti * ti;
    const tp1 = 6 * t * ti;
    const tp2 = 3 * t * t;

    return (
      this.p1.subtract(
        this.p0
      ).mulS(
        tp0
      ).add(
        this.p2.subtract(
          this.p1
        ).mulS(
          tp1
        )
      ).add(
        this.p3.subtract(
          this.p2
        ).mulS(
          tp2
        )
      )
    );
  }

  /**
   * Gets the tangent (normalized derivative) of the curve at a given T value.
   * @param t Time value at which to sample (should be between 0 and 1, though it won't fail if outside that range).
   * @return Direction the curve is going at that point.
   */
  public Tangent(t: number): Vector {
    return this.Derivative(t).normalise();
  }

  public ToString(): string {
    const sb: string[] = [];
    sb.push('CubicBezier: (<');
    sb.push(this.p0.getX().toPrecision(4));
    sb.push(', ');
    sb.push(this.p0.getY().toPrecision(4));
    sb.push('> <');
    sb.push(this.p1.getX().toPrecision(4));
    sb.push(', ');
    sb.push(this.p1.getY().toPrecision(4));
    sb.push('> <');
    sb.push(this.p2.getX().toPrecision(4));
    sb.push(', ');
    sb.push(this.p2.getY().toPrecision(4));
    sb.push('> <');
    sb.push(this.p3.getX().toPrecision(4));
    sb.push(', ');
    sb.push(this.p3.getY().toPrecision(4));
    sb.push('>)');
    return sb.join(' ');
  }
}
