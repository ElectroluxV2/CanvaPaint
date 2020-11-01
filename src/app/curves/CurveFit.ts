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

import { CurveFitBase } from './CurveFitBase';
import { CubicBezier } from './CubicBezier';
import { Vector } from 'vector2d';

/**
 * Implements a least-squares bezier curve fitting routine based on http://tog.acm.org/resources/GraphicsGems/gems/FitCurves.c with a few
 * optimizations made by me. You can read the article here: http://read.pudn.com/downloads141/ebook/610086/GraphicsGemsI.pdf page 626.
 * To use, call the Fit static function and wait for magic to happen.
 */
export class CurveFit extends CurveFitBase {
  /**
   * Shared zero-curve array.
   * @private
   */
  private readonly NOCURVES: CubicBezier[] = [];

  /**
   * Curves we've found so far.
   */
  private result: CubicBezier[] = [];

  /**
   * Attempts to fit a set of Bezier curves to the given data. It returns a set of curves that form a
   * ttp://en.wikipedia.org/wiki/CompositeB%C3%A9ziercurve with C1 continuity (that is, each curve's start
   * point is coincident with the previous curve's end point, and the tangent vectors of the start and end
   * points are going in the same direction, so the curves will join up smoothly). Returns an empty array
   * if less than two points in input.
   *
   * Input data MUST not contain repeated points (that is, the same point twice in succession). The best way to
   * ensure this is to call any one of the methods in CurvePreprocess, since all three pre-processing
   * methods will remove duplicate points. If repeated points are encountered, unexpected behavior can occur.
   *
   * @param points Set of points to fit to.
   * @param maxError Maximum distance from any data point to a point on the generated curve.
   * @returns Fitted curves or an empty list if it could not fit.
   */
  public Fit(points: Vector[], maxError: number): CubicBezier[] {
    if (maxError < this.EPSILON) {
      throw new Error('maxError cannot be negative/zero/less than epsilon value');
    }

    if (points == null) {
      throw new Error('Null argument: points');
    }

    // Need at least 2 points to do anything
    if (points.length < 2) {
      return this.NOCURVES;
    }

    try
    {
      // should be cleared after each run
      if (!(this.pts.length === 0 && this.result.length === 0 && this.u.length === 0 && this.arclen.length === 0)) {
        console.warn('Assertion failed!');
      }

      // initialize arrays
      this.pts.push(...points);
      this.InitializeArcLengths();
      this.squaredError = maxError * maxError;

      // Find tangents at ends
      const last = points.length - 1;
      const tanL = this.GetLeftTangent(last);
      const tanR = this.GetRightTangent(0);

      // Do the actual fit
      this.FitRecursive(0, last, tanL, tanR);

      return this.result;
    } finally {

      this.pts = [];
      this.result = [];
      this.arclen = [];
      this.u = [];
    }
  }

  /**
   * Main fit function that attempts to fit a segment of curve and recurses if unable to.
   */
  private FitRecursive(first: number, last: number, tanL: Vector, tanR: Vector): void {

    const r = this.FitCurve(first, last, tanL, tanR);
    const split = r.split;
    const curve = r.curve;

    if (r.error) {
      this.result.push(curve);
    } else {
      // If we get here, fitting failed, so we need to recurse
      // First, get mid tangent
      const tanM1 = this.GetCenterTangent(first, last, split);
      const tanM2 = tanM1.reverse();

      // our end tangents might be based on points outside the new curve (this is possible for mid tangents too
      // but since we need to maintain C1 continuity, it's too late to do anything about it)
      if (first === 0 && split < this.END_TANGENT_N_PTS) {
        tanL = this.GetLeftTangent(split);
      }

      if (last === this.pts.length - 1 && split > (this.pts.length - (this.END_TANGENT_N_PTS + 1))) {
        tanR = this.GetRightTangent(split);
      }

      // Do actual recursion
      this.FitRecursive(first, split, tanL, tanM1);
      this.FitRecursive(split, last, tanM2, tanR);
    }
  }
}
