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
import { CurveFitBase } from './CurveFitBase';
import { CubicBezier } from './CubicBezier';

/**
 * Changes made to the CurveBuilder.curves list after a call to CurveBuilder.AddPoint.
 * this seems like a prime candidate for an F#-style discriminated union/algebraic data type.
 */
export class AddPointRes {

  // No changes were made.
  public static readonly NO_CHANGE: AddPointRes = new AddPointRes(0, false);

  // Packed value... need this so that default(AddPointResult) which is always 0 to represent no change
  private readonly data: number;

  // Were any curves changed or added?
  get WasChanged(): boolean {
    return this.data !== 0;
  }

  // Index into curves array of first curve that was changed, or -1 if no curves were changed.
  // All curves after this are assumed to have changed/been added as well. If a curve was added
  // this is a considered a "change" so WasAdded will always be true.
  get FirstChangedIndex(): number {
    return Math.abs(this.data) - 1;
  }

  // Were any curves added?
  public WasAdded(): boolean {
    return this.data < 0;
  }

  public constructor(firstChangedIndex: number, curveAdded: boolean) {
    if (firstChangedIndex < 0 || firstChangedIndex === Number.MAX_VALUE) {
      throw new Error('firstChangedIndex must be greater than zero');
    }
    this.data = (firstChangedIndex + 1) * (curveAdded ? -1 : 1);
  }
}

/**
 * This is a version of CurveFit that works on partial curves so that a spline can be built in "realtime"
 * as the user is drawing it. The quality of the generated spline may be lower, and it might use more Bezier curves
 * than is necessary. Only the most recent two curves will be modified, once another curve is being built on top of it, curves
 * lower in the "stack" are permanent. This reduces visual jumpiness as the user draws since the entire spline doesn't move
 * around as points are added. It only uses linearization-based preprocessing; it doesn't support the RDP method.
 *
 * Add points using the AddPoint method.To get the results, either enumerate (foreach) the CurveBuilder itself
 * or use the Curves property. The results might be updated every time a point is added.
 */
export class CurveBuilder extends CurveFitBase{

  // Result curves (updated whenever a new point is added)
  private result: CubicBezier[];

  // ReadOnlyCollection view of result
  private readonly resultView: CubicBezier[];

  // Distance between points
  private readonly linDist: number;

  // Most recent point added
  private prev: Vector;

  // Left tangent of current curve (can't change this except on first curve or we'll lose C1 continuity)
  private tanL: Vector;

  // Total length of the curve so far (for updating arclen)
  private totalLength: number;

  // Index of first point in current curve
  private first: number;

  public constructor(linDist: number, error: number) {
    super();
    this.squaredError = error * error;
    this.result = [];
    this.resultView = [];
    this.linDist = linDist;
  }

  /**
   * Adds a data point to the curve builder. This doesn't always result in the generated curve changing immediately.
   * @param p The data point to add.
   * @returns AddPointRes for info about this.
   */
  public AddPoint(p: Vector): AddPointRes {
    let prev = this.prev;
    const pts = this.pts;
    const count = pts.length;
    if (count !== 0) {
      const td = prev.distance(p);
      const md = this.linDist;
      if (td > md) {
        let first = Number.MIN_VALUE;
        let add = false;
        let rd = td - md;
        // OPTIMIZE if we're adding many points at once, we could do them in a batch
        const dir = p.subtract(prev).normalize();
        do {
          const np = prev.add(dir).mulS(md);
          const res = this.AddInternal(np);
          first = Math.min(first, res.FirstChangedIndex);
          // @ts-ignore
          // tslint:disable-next-line:no-bitwise
          add |= res.WasAdded;
          prev = np;
          rd -= md;
        } while (rd > md);
        this.prev = prev;
        return new AddPointRes(first, add);
      }
      return AddPointRes.NO_CHANGE;
    }
    else
    {
      this.prev = p;
      this.pts.push(p);
      this.arclen.push(0);
      return AddPointRes.NO_CHANGE; // no curves were actually added yet
    }
  }

  private AddInternal(np: Vector): AddPointRes {
    const pts = this.pts;
    const last = pts.length;

    // Should always have one point at least
    if (!(last !== 0)) {
      console.warn('Assert failed');
    }

    this.pts.push(np);
    this.arclen.push(this.totalLength = this.totalLength + this.linDist);
    if (last === 1) {
      // This is the second point
      if (!(this.result.length === 0)) {
        console.warn('Assert failed');
      }

      const p0 = pts[0];
      const tanL = np.subtract(p0).normalize();
      const tanR = tanL.reverse();
      this.tanL = tanL;
      const alpha = this.linDist / 3;
      const p1 = tanL.mulS(alpha).add(p0);
      const p2 = tanR.mulS(alpha).add(np);
      this.result.push(new CubicBezier(p0, p1, p2, np));
      return new AddPointRes(0, true);
    } else {
      const lastCurve = this.result.length - 1;
      const first = this.first;

      // If we're on the first curve, we're free to improve the left tangent
      let tanL = lastCurve === 0 ? this.GetLeftTangent(last) : this.tanL;

      // We can always do the end tangent
      const tanR = this.GetRightTangent(first);

      // Try fitting with the new point
      let r = this.FitCurve(first, last, tanL, tanR);
      const split = r.split;
      const curve = r.curve;

      if (r.error) {
        this.result[lastCurve] = curve;
        return new AddPointRes(lastCurve, false);
      } else {
        // Need to split
        // first, get mid tangent
        const tanM1 = this.GetCenterTangent(first, last, split);
        const tanM2 = tanM1.reverse();

        // PERHAPS do a full fitRecursive here since its our last chance?

        // Our left tangent might be based on points outside the new curve (this is possible for mid tangents too
        // But since we need to maintain C1 continuity, it's too late to do anything about it)
        if (first === 0 && split < this.END_TANGENT_N_PTS) {
          tanL = this.GetLeftTangent(split);
        }

        // Do a final pass on the first half of the curve
        r = this.FitCurve(first, split, tanL, tanM1);
        this.result[lastCurve] = r.curve;

        // Prepare to fit the second half
        r = this.FitCurve(split, last, tanM2, tanR);
        this.result.push(r.curve);
        this.first = split;
        this.tanL = tanM2;

        return new AddPointRes(lastCurve, true);
      }
    }
  }

  /// Clears the curve builder.
  public Clear(): void {
    this.result = [];
    this.pts = [];
    this.arclen = [];
    this.u = [];
    this.totalLength = 0;
    this.first = 0;
    this.tanL = new Vector(0, 0);
    this.prev = new Vector(0, 0);
  }

  /// The current curves in the builder.
  public get Curves(): CubicBezier[] { return this.resultView; }

}
