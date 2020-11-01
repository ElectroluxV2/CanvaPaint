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

import { CurveBuilder } from './CurveBuilder';
import { Spline } from './Spline';
import { Vector } from 'vector2d';
import { CubicBezier } from './CubicBezier';

/**
 * Wraps a CurveBuilder and Spline together. Allows you to add data points as they come in and
 * generate a smooth spline from them without doing unnecessary computation.
 */
export class SplineBuilder {
  // Underlying curve fitter
  private readonly builder: CurveBuilder;

  // Underlying spline
  private readonly spline: Spline;

  constructor(pointDistance: number, error: number, samplesPerCurve: number) {
    this.builder = new CurveBuilder(pointDistance, error);
    this.spline = new Spline(samplesPerCurve);
  }

  /**
   * Adds a data point.
   * @param p Data point to add.
   */
  public Add(p: Vector): boolean {
  const res = this.builder.AddPoint(p);

  if (!res.WasChanged) {
    return false;
  }

  // Update spline
  const curves = this.builder.Curves;
  if (res.WasAdded && curves.length === 1) {
    // First curve
    if (!(this.spline.Curves.length === 0)) {
      console.log('Assertion failed');
    }

    this.spline.Add(curves[0]);
  }
  else if (res.WasAdded) {
    // Split
    this.spline.Update(this.spline.Curves.length - 1, curves[res.FirstChangedIndex]);
    for (let i = res.FirstChangedIndex + 1; i < curves.length; i++) {
      this.spline.Add(curves[i]);
    }
  }
  else
  {
    // last curve updated
    if (!(res.FirstChangedIndex === curves.length - 1)) {
      console.log('Assertion failed');
    }
    this.spline.Update(this.spline.Curves.length - 1, curves[curves.length - 1]);
  }

  return true;
  }

  /** Gets the position of a point on the spline that's close to the desired point along the spline. For example, if u = 0.5, then a point
   * that's about halfway through the spline will be returned. The returned point will lie exactly on one of the curves that make up the
   * spline.
   * @param u How far along the spline to sample (eg, 0.5 will be halfway along the length of the spline). Should be between 0 and 1.
   * @returns The position on the spline
   */
  public Sample(u: number): Vector {
    return this.spline.Sample(u);
  }

  /**
   * Gets the tangent of a point on the spline that's close to the desired point along the spline. For example, if u = 0.5, then the
   * direction vector 8 that's about halfway through the spline will be returned. The returned value will be a normalized direction vector.
   * @param u How far along the spline to sample (eg, 0.5 will be halfway along the length of the spline). Should be between 0 and 1.
   * @returns The position on the spline.
   */
  public Tangent(u: number): Vector {
    const pos = this.spline.GetSamplePosition(u);
    return this.spline.Curves[pos.curveIndex].Tangent(pos.time);
  }

  /// Clears the SplineBuilder.
  public Clear(): void {
    this.builder.Clear();
    this.spline.Clear();
  }

  // The curves that make up the spline.
  public get Curves(): CubicBezier[] {
    return this.spline.Curves;
  }

}
