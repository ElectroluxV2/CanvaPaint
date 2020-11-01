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


import { VectorHelper } from './VectorHelper';
import { CubicBezier } from './CubicBezier';
import { Vector } from 'vector2d';

// Point at which to sample the spline.
interface SamplePos {

  // Index of sampled curve in the spline curves array.
  curveIndex: number;

  // The "t" value from which to sample the curve.
  time: number;
}

/**
 * Maps a set of 2D Bezier curves so that samples are equally spaced across the spline. Basically, it does a lot of preprocessing and
 * such on a set of curves so that when you call sample(0.5) you get a point that's halfway along the spline. This means that if you
 * "move" something along the spline, it will move at a constant velocity. This is also useful for rendering the spline since the points
 * will be evenly spaced.
 */
export class Spline {
  public MIN_SAMPLES_PER_CURVE = 8;
  public MAX_SAMPLES_PER_CURVE = 1024;
  private EPSILON = VectorHelper.EPSILON;

  private curves: CubicBezier[] = [];
  private readonly curvesView: CubicBezier[] = [];
  private arclen: number[] = [];
  private readonly samplesPerCurve: number;

  /**
   * Creates an empty spline.
   * @param samplesPerCurve Resolution of the curve. Values 32-256 work well. You may need more or less depending on how big the curves are.
   */
  constructor(samplesPerCurve: number);

  /**
   * Creates a new spline from the given curves.
   * @param curves Curves to create the spline from.
   * @param samplesPerCurve Resolution of the curve. Values 32-256 work well. You may need more or less depending on how big the curves are.
   */
  constructor(samplesPerCurve: number, curves: CubicBezier[] = []) {
    if (curves == null) {
      throw new Error('curves');
    }
    if (samplesPerCurve < this.MIN_SAMPLES_PER_CURVE || samplesPerCurve > this.MAX_SAMPLES_PER_CURVE) {
      throw new Error('samplesPerCurve must be between ' + this.MIN_SAMPLES_PER_CURVE + ' and ' + this.MAX_SAMPLES_PER_CURVE);
    }
    this.samplesPerCurve = samplesPerCurve;
    this.curves = [];
    this.curvesView = [...this.curves];
    this.arclen = [];
    for (const curve of curves) {
      this.Add(curve);
    }
  }

  // Adds a curve to the end of the spline.
  public Add(curve: CubicBezier): void {
    if (this.curves.length > 0 && !this.curves[this.curves.length - 1].p3.equals(curve.p0)) {
      throw new Error('The new curve does at index '
        + this.curves.length +
        ' does not connect with the previous curve at index '
        + (this.curves.length - 1)
      );
    }
    this.curves.push(curve);
    // Expand the array since updateArcLengths expects these values to be there
    for (let i = 0; i < this.samplesPerCurve; i++) {
      this.arclen.push(0);
    }
    this.UpdateArcLengths(this.curves.length - 1);
  }

  /**
   * Modifies a curve in the spline. It must connect with the previous and next curves (if applicable). This requires that the
   * arc length table be recalculated for that curve and all curves after it -- for example, if you update the first curve in the
   * spline, each curve after that would need to be recalculated (could avoid this by caching the lengths on a per-curve basis if you're
   * doing this often, but since the typical case is only updating the last curve, and the entire array needs to be visited anyway, it
   * wouldn't save much).
   * @param index Index of the curve to update in Curves.
   * @param curve The new curve with which to replace it.
   */
  public Update(index: number, curve: CubicBezier): void {
    if (index < 0) {
      throw new Error('Negative index');
    }

    if (index >= this.curves.length) {
      throw new Error('Curve index ' + index + ' is out of range (there are ' + this.curves.length + ' curves in the spline)');
    }

    if (index > 0 && !this.curves[index - 1].p3.equals(curve.p0)) {
      throw new Error('The updated curve at index ' + index + ' does not connect with the previous curve at index ' + (index - 1));
    }

    if (index < this.curves.length - 1 && !this.curves[index + 1].p0.equals(curve.p3)) {
      throw new Error('The updated curve at index ' + index + ' does not connect with the next curve at index ' + (index + 1));
    }

    this.curves[index] = curve;
    for (let i = index; i < this.curves.length; i++) {
      this.UpdateArcLengths(i);
    }
  }

  // Clears the spline.
  public Clear(): void {
    this.curves = [];
    this.arclen = [];
  }

  // Gets the total length of the spline.
  public get Length(): number {
    const arclen = this.arclen;
    const count = arclen.length;
    return count === 0 ? 0 : arclen[count - 1];
  }

  // Gets a read-only view of the current curves collection.
  public get Curves(): CubicBezier[] {
    return this.curvesView;
  }

  /**
   *  Gets the position of a point on the spline that's close to the desired point along the spline. For example, if u = 0.5, then a point
   * that's about halfway through the spline will be returned. The returned point will lie exactly on one of the curves that make up the
   * spline.
   * @param u How far along the spline to sample (eg, 0.5 will be halfway along the length of the spline). Should be between 0 and 1.
   * @returns The position on the spline.
   */
  public Sample(u: number): Vector {
    const pos = this.GetSamplePosition(u);
    return this.curves[pos.curveIndex].Sample(pos.time);
  }

  public GetSamplePosition(u: number): SamplePos {
    if (this.curves.length === 0) {
      throw new Error('No curves have been added to the spline');
    }
    if (u < 0) {
      return { curveIndex: 0, time: 0 } as SamplePos;
    }
    if (u > 1) {
      return { curveIndex: this.curves.length - 1, time: 1 };
    }

    const arclen = this.arclen;
    const total = this.Length;
    const target = u * total;

    if (!(target >= 0)) {
      console.warn('Assertion failed');
    }

    // Binary search to find largest value <= target
    let index = 0;
    let low = 0;
    let high = arclen.length - 1;
    let found = Number.NaN;
    while (low < high) {
      index = (low + high) / 2;
      found = arclen[index];
      if (found < target) {
        low = index + 1;
      } else {
        high = index;
      }
    }

    // This should be a rather rare scenario: we're past the end, but this wasn't picked up by the test for u >= 1
    if (index >= arclen.length - 1) {
      return { curveIndex: this.curves.length - 1, time: 1 };
    }

    // this can happen because the binary search can give us either index or index + 1
    if (found > target) {
      index--;
    }

    if (index < 0) {
      // We're at the beginning of the spline
      const max = arclen[0];
      if (!(target <= max + this.EPSILON)) {
        console.warn('Assertion failed');
      }
      const part = target / max;
      const t = part / this.samplesPerCurve;
      return { curveIndex: 0, time: t };
    }
    else
    {
      // interpolate between two values to see where the index would be if continuous values
      const min = arclen[index];
      const max = arclen[index + 1];
      if (!(target >= min - this.EPSILON && target <= max + this.EPSILON)) {
        console.warn('Assertion failed');
      }
      const part = target < min ? 0 : target > max ? 1 : (target - min) / (max - min);
      const t = (((index + 1) % this.samplesPerCurve) + part) / this.samplesPerCurve;
      const curveIndex = (index + 1) / this.samplesPerCurve;
      return { curveIndex, time: t };
    }
  }

  // Updates the internal arc length array for a curve. Expects the list to contain enough elements.
  public UpdateArcLengths(iCurve: number): void {
    const curve = this.curves[iCurve];
    const nSamples = this.samplesPerCurve;
    const arclen = this.arclen;
    let clen = iCurve > 0 ? arclen[iCurve * nSamples - 1] : 0;
    let pp = curve.p0;

    if (!(arclen.length >= ((iCurve + 1) * nSamples))) {
      console.warn('Assertion failed');
    }

    for (let iPoint = 0; iPoint < nSamples; iPoint++) {
      const idx = (iCurve * nSamples) + iPoint;
      const t = (iPoint + 1) / nSamples;
      const np = curve.Sample(t);
      const d = np.distance(pp);
      clen += d;
      arclen[idx] = clen;
      pp = np;
    }
  }
}
