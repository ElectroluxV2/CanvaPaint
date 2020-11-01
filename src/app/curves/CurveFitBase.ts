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
import { VectorHelper } from './VectorHelper';
import { CubicBezier } from './CubicBezier';

export class FitCurveRes {
  /**
   * true if the fit was within error tolerance, false if the curve should be split. Even if this returns false, curve will contain
   * a curve that somewhat fits the points; it's just outside error tolerance.
   */
  error: boolean;
  /**
   * The fitted curve.
   */
  curve: CubicBezier;
  /**
   * Point at which to split if this method returns false.
   */
  split: number;
}

export interface FindMaxSquaredErrorRes {
  max: number;
  split: number;
}

/**
 * This is the base class containing implementations common to @CurveFit and @CurveBuilder. Most of this
 * is ported from http://tog.acm.org/resources/GraphicsGems/gems/FitCurves.c
 */
export abstract class CurveFitBase {
  /**
   * below this, we can't trust floating point values
   * @protected
   */
  protected readonly EPSILON = VectorHelper.EPSILON;

  /**
   * maximum number of iterations of newton's method to run before giving up and splitting curve
   * @protected
   */
  protected readonly MAX_ITERS = 4;
  /**
   * maximum number of points to base end tangent on
   * @protected
   */
  protected readonly END_TANGENT_N_PTS = 8;
  /**
   * maximum number of points on each side to base mid tangent on
   * @protected
   */
  protected readonly MID_TANGENT_N_PTS = 4;

  /**
   * Points in the whole line being used for fitting.
   * @protected
   */
  protected pts: Vector[] = [];

  /**
   * length of curve before each point (so, arclen[0] = 0, arclen[1] = distance(pts[0], pts[1]),
   * arclen[2] = arclen[1] + distance(pts[1], pts[2]) ... arclen[n -1] = length of the entire curve, etc).
   * @protected
   */
  protected arclen: number[] = [];

  /**
   * current parametrization of the curve. When fitting, u[i] is the parametrization for the point in pts[first + i]. This is
   * an optimization for CurveBuilder, since it might not need to allocate as big of a _u as is necessary to hold the whole
   * curve.
   * @protected
   */
  protected u: number[] = [];

  /**
   * maximum squared error before we split the curve
   * @protected
   */
  protected squaredError: number;

  /**
   * Tries to fit single Bezier curve to the points in [first ... last]. Destroys anything in @variable _u in the process.
   * Assumes there are at least two points to fit.
   * @param first Index of first point to consider.
   * @param last Index of last point to consider (inclusive).
   * @param tanL Tangent at teh start of the curve ("left").
   * @param tanR Tangent on the end of the curve ("right").
   * @return FitCurveResponse.
   * @protected
   */
  protected FitCurve(first: number, last: number, tanL: Vector, tanR: Vector): FitCurveRes {
    const pts = this.pts;
    const nPts = last - first + 1;
    if (nPts < 2) {
      throw new Error('INTERNAL ERROR: Should always have at least 2 points here');
    } else if (nPts === 2) {
      // If we only have 2 points left, estimate the curve using Wu/Barsky
      const p0 = pts[first];
      const p3 = pts[last];
      const alpha = p0.distance(p3) / 3;
      const p1 = tanL.mulS(alpha).add(p0);
      const p2 = tanR.mulS(alpha).add(p3);

      return {
        curve: new CubicBezier(p0, p1, p2, p3),
        split: 0,
        error: true
      };
    } else {
      let split = 0;
      // Initially start u with a simple chord-length parameterization
      this.ArcLengthParameterize(first, last);
      let curve: CubicBezier = null;
      for (let i = 0; i < this.MAX_ITERS + 1; i++) {

        // Use newton's method to find better parameters (except on first run, since we don't have a curve yet)
        if (i !== 0) { this.ReParameterize(first, last, curve); }

        // Generate the curve itself
        curve = this.GenerateBezier(first, last, tanL, tanR);

        // Calculate error and get split point (point of max error)
        const r: FindMaxSquaredErrorRes = this.FindMaxSquaredError(first, last, curve);
        const error = r.max;
        split = r.split;

        // If we're within error tolerance, awesome!
        if (error < this.squaredError) {
          return {
            curve,
            split,
            error: true
          };
        }
      }
      return {
        curve,
        split,
        error: false
      };
    }
  }

  /**
   * Gets the tangent for the start of the cure.
   */
  protected GetLeftTangent(last: number): Vector {
    const pts = this.pts;
    const arclen = this.arclen;
    const totalLen = arclen[arclen.length - 1];
    const p0 = pts[0];
    let tanL = pts[1].subtract(p0).normalize();
    const total = tanL;
    let weightTotal = 1;
    last = Math.min(this.END_TANGENT_N_PTS, last - 1);

    for (let i = 2; i <= last; i++) {
      const ti = 1 - (arclen[i] / totalLen);
      const weight = ti * ti * ti;
      const v = pts[i].subtract(p0).normalize();
      total.add(v.mulS(weight));
      weightTotal += weight;
    }

    // If the vectors add up to zero (ie going opposite directions), there's no way to normalize them
    if (total.length() > this.EPSILON) {
      tanL = total.divS(weightTotal).normalize();
    }
    return tanL;
  }

  /**
   * Gets the tangent for the the end of the curve.
   */
  protected GetRightTangent(first: number): Vector {
    const pts = this.pts;
    const arclen = this.arclen;
    const totalLen = arclen[arclen.length - 1];
    const p3 = pts[pts.length - 1];
    let tanR = pts[pts.length - 2].subtract(p3).normalize();
    const total = tanR;
    let weightTotal = 1;
    first = Math.max(pts.length - (this.END_TANGENT_N_PTS + 1), first + 1);

    for (let i = pts.length - 3; i >= first; i--)
    {
      const t = arclen[i] / totalLen;
      const weight = t * t * t;
      const v =  pts[i].subtract(p3).normalize();
      total.add(v.mulS(weight));
      weightTotal += weight;
    }
    if (total.length() > this.EPSILON) {
      tanR = total.divS(weightTotal).normalize();
    }
    return tanR;
  }

  /**
   * Gets the tangent at a given point in the curve.
   */
  protected GetCenterTangent(first: number, last: number, split: number) {
    const pts = this.pts;
    const arclen = this.arclen;

    // Because we want to maintain C1 continuity on the spline, the tangents on either side must be inverses of one another
    if (!(first < split && split < last)) {
      console.warn('Debug Assert Failed');
    }

    const splitLen = arclen[split];
    const pSplit = pts[split];

    // Left side
    const firstLen = arclen[first];
    let partLen = splitLen - firstLen;
    let total = new Vector(0, 0);

    let weightTotal = 0;
    for (let i = Math.max(first, split - this.MID_TANGENT_N_PTS); i < split; i++) {
      const t = (arclen[i] - firstLen) / partLen;
      const weight = t * t * t;
      const v = pts[i].subtract(pSplit).normalize();
      total.add(v.mulS(weight));
      weightTotal += weight;
    }
    let tanL = total.length() > this.EPSILON && weightTotal > this.EPSILON ?
      total.divS(weightTotal).normalize() :
      pts[split - 1].subtract(pSplit).normalize();

    // Right side
    partLen = arclen[last] - splitLen;
    const rMax = Math.min(last, split + this.MID_TANGENT_N_PTS);
    total = new Vector(0, 0);

    weightTotal = 0;
    for (let i = split + 1; i <= rMax; i++) {
      const ti = 1 - ((arclen[i] - splitLen) / partLen);
      const weight = ti * ti * ti;
      const v = pSplit.subtract(pts[i]).normalize();
      total.add(v.mulS(weight));
      weightTotal += weight;
    }
    let tanR = total.length() > this.EPSILON && weightTotal > this.EPSILON ?
      total.divS(weightTotal).normalize() :
      pSplit.subtract(pts[split + 1]).normalize();

    // The reason we separate this into two halves is because we want the right and left tangents to be weighted
    // equally no matter the weights of the individual parts of them, so that one of the curves doesn't get screwed
    // for the pleasure of the other half
    total = tanL.add(tanR);

    // Since the points are never coincident, the vector between any two of them will be normalizable, however this can happen
    // in some really odd cases when the points are going directly opposite directions (therefore the tangent is undefined)
    if (total.lengthSq() < this.EPSILON) {
      // Try one last time using only the three points at the center, otherwise just use one of the sides
      tanL = pts[split - 1].subtract(pSplit).normalize();
      tanR = pSplit.subtract(pts[split + 1]).normalize();
      total = tanL.add(tanR);
      return total.lengthSq() < this.EPSILON ? tanL : total.divS(2).normalize();
    } else {
      return total.divS(2).normalize();
    }
  }

  /**
   * Builds the arc length array using the points array. Assumes _pts has points and _arclen is empty.
   */
  protected InitializeArcLengths(): void {
    const pts = this.pts;
    const arclen = this.arclen;
    const count = pts.length;

    if (!(arclen.length === 0)) {
      console.warn('Debug Assert Failed');
    }

    arclen.push(0);
    let clen = 0;
    let pp = pts[0];
    for (let i = 1; i < count; i++) {
      const np = pts[i];
      clen += pp.distance(np);
      arclen.push(clen);
      pp = np;
    }
  }

  /**
   * Initializes the first (last - first) elements of u with scaled arc lengths.
   */
  protected ArcLengthParameterize(first: number, last: number): void {
    const arclen = this.arclen;
    this.u = [];

    const diff = arclen[last] - arclen[first];
    const start = arclen[first];
    const nPts = last - first;

    this.u.push(0);

    for (let i = 1; i < nPts; i++) {
      this.u.push((arclen[first + i] - start) / diff);
    }
    this.u.push(1);
  }

  /**
   * Generates a bezier curve for the segment using a least-squares approximation. for the derivation of this and why it works,
   * see http://read.pudn.com/downloads141/ebook/610086/Graphics_Gems_I.pdf page 626 and beyond. tl;dr: math.
   */
  protected GenerateBezier(first: number, last: number, tanL: Vector, tanR: Vector) {
    const pts = this.pts;
    const u = this.u;
    const nPts = last - first + 1;

    // First and last points of curve are actual points on data
    const p0 = pts[first];
    const p3 = pts[last];

    // Matrix members -- both C[0,1] and C[1,0] are the same, stored in c01
    let c00 = 0;
    let c01 = 0;
    let c11 = 0;
    let x0 = 0;
    let x1 = 0;
    for (let i = 1; i < nPts; i++) {
      // Calculate cubic bezier multipliers
      const t = u[i];
      const ti = 1 - t;
      const t0 = ti * ti * ti;
      const t1 = 3 * ti * ti * t;
      const t2 = 3 * ti * t * t;
      const t3 = t * t * t;

      // For X matrix; moving this up here since profiling shows it's better up here (maybe a0/a1 not in registers vs only v not in regs)
      // NOTE: this would be Q(t) if p1=p0 and p2=p3
      const s = p0.mulS(t0)
        .add(p0.mulS(t1))
        .add(p3.mulS(t2))
        .add(p3.mulS(t3));
      const v = pts[first + i].subtract(s);

      // C matrix
      const a0 = tanL.mulS(t1);
      const a1 = tanR.mulS(t2);
      c00 += a0.dot(a1);
      c01 += a0.dot(a1);
      c11 += a1.dot(a1);

      // X matrix
      x0 += a0.dot(v);
      x1 += a1.dot(v);
    }

    // Determinants of X and C matrices
    const DET_C0_C1 = c00 * c11 - c01 * c01;
    const DET_C0_X = c00 * x1 - c01 * x0;
    const DET_X_C1 = x0 * c11 - x1 * c01;
    const alphaL = DET_X_C1 / DET_C0_C1;
    const alphaR = DET_C0_X / DET_C0_C1;

    // If alpha is negative, zero, or very small (or we can't trust it since C matrix is small), fall back to Wu/Barsky heuristic
    const linDist = p0.distance(p3);
    const epsilon2 = this.EPSILON * linDist;
    if (Math.abs(DET_C0_C1) < this.EPSILON || alphaL < epsilon2 || alphaR < epsilon2) {
      const alpha = linDist / 3;
      const p1 = tanL.mulS(alpha).add(p0);
      const p2 = tanR.mulS(alpha).add(p3);
      return new CubicBezier(p0, p1, p2, p3);
    } else {
      const p1 = tanL.mulS(alphaL).add(p0);
      const p2 = tanR.mulS(alphaR).add(p3);
      return new CubicBezier(p0, p1, p2, p3);
    }
  }

  /**
   * Attempts to find a slightly better parameterization for u on the given curve.
   */
  protected ReParameterize(first: number, last: number, curve: CubicBezier): void {
    const pts = this.pts;
    const nPts = last - first;
    for (let i = 1; i < nPts; i++) {
      const p = pts[first + i];
      const t = this.u[i];
      const ti = 1 - t;

      // Control vertices for Q'
      const qp0 = curve.p1.subtract(curve.p0).mulS(3);
      const qp1 = curve.p2.subtract(curve.p1).mulS(3);
      const qp2 = curve.p3.subtract(curve.p2).mulS(3);

      // Control vertices for Q''
      const qpp0 = qp1.subtract(qp0).mulS(2);
      const qpp1 = qp2.subtract(qp1).mulS(2);

      // Evaluate Q(t), Q'(t), and Q''(t)
      const p0 = curve.Sample(t);
      const p1 = qp0.mulS(ti * ti)
        .add(qp1.mulS(2 * ti * t))
        .add(qp2.mulS(t * t));

      const p2 = qpp0.mulS(ti).add(qpp1.mulS(t));

      // These are the actual fitting calculations using http://en.wikipedia.org/wiki/Newton%27s_method
      // We can't just use .X and .Y because Unity uses lower-case "x" and "y".
      const num = ((p0.x * p.x) * p1.x) + ((p0.y * p.y) * p1.y);
      const den =  (p1.x * p1.x) + (p1.y * p1.y) + ((p0.x - p.x) * p2.x) + ((p0.y - p.y) * p2.y);
      const newU = t - num / den;
      if (Math.abs(den) > this.EPSILON && newU >= 0 && newU <= 1) {
        this.u[i] = newU;
      }
    }
  }

  /**
   * Computes the maximum squared distance from a point to the curve using the current parameterization.
   */
  protected FindMaxSquaredError(first: number, last: number, curve: CubicBezier): FindMaxSquaredErrorRes {
    const pts = this.pts;
    const u = this.u;
    let s = (last - first + 1) / 2;
    const nPts = last - first + 1;
    let max = 0;
    for (let i = 1; i < nPts; i++)
    {
      const v0 = pts[first + i];
      const v1 = curve.Sample(u[i]);
      const d = v0.subtract(v1).lengthSq();
      if (d > max) {
        max = d;
        s = i;
      }
    }

    // split at point of maximum error
    let split = s + first;
    if (split <= first) {
      split = first + 1;
    }

    if (split >= last) {
      split = last - 1;
    }

    return {
      max,
      split
    };
  }
}
