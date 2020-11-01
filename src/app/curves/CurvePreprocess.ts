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

import {VectorHelper} from './VectorHelper';
import {Vector} from 'vector2d';

export class CurvePreprocess {
  private static readonly EPSILON = VectorHelper.EPSILON;

  /**
   * Creates a list of equally spaced points that lie on the path described by straight line segments between
   * adjacent points in the source list.
   * @param src Source list of points.
   * @param md Distance between points on the new path.
   * @returns List of equally-spaced points on the path.
   */
  public static Linearize(src: Vector[], md: number) {
    if (src == null) { throw new Error('src'); }

    if (md <= this.EPSILON) { throw new Error('md ' + md + ' is be less than epsilon ' + this.EPSILON); }
    const dst: Vector[] = [];
    if (src.length > 0) {
      let pp = src[0];
      dst.push(pp);
      let cd = 0;
      for (let ip = 1; ip < src.length; ip++) {
        const p0 = src[ip - 1];
        const p1 = src[ip];
        const td = p0.distance(p1);
        if (cd + td > md) {
          const pd = md - cd;
          dst.push(VectorHelper.Lerp(p0, p1, pd / td));
          let rd = td - pd;
          while (rd > md) {
            rd -= md;
            const np = VectorHelper.Lerp(p0, p1, (td - rd) / td);
            if (!np.equals(pp)) {
              dst.push(np);
              pp = np;
            }
          }
          cd = rd;
        } else {
          cd += td;
        }
      }
      // Last point
      const lp = src[src.length - 1];
      if (!pp.equals(lp)) {
        dst.push(lp);
      }
    }
    return dst;
  }

  protected static RdpRecursive(pts: Vector[], error: number, first: number, last: number, keepIndex: number[]): void {
    const nPts = last - first + 1;
    if (nPts < 3) {
      return;
    }

    const a = pts[first];
    const b = pts[last];
    const abDist = a.distance(b);
    const aCrossB = a.cross(b);
    let maxDist = error;
    let split = 0;
    for (let i = first + 1; i < last - 1; i++) {
      const p = pts[i];
      const pDist = this.PerpendicularDistance(a, b, abDist, aCrossB, p);
      if (pDist > maxDist) {
        maxDist = pDist;
        split = i;
      }
    }

    if (split !== 0) {
      keepIndex.push(split);
      this.RdpRecursive(pts, error, first, split, keepIndex);
      this.RdpRecursive(pts, error, split, last, keepIndex);
    }
  }

  /**
   * "Reduces" a set of line segments by removing points that are too far away. Does not modify the input list; returns
   * a new list with the points removed.
   * The image says it better than I could ever describe: http://upload.wikimedia.org/wikipedia/commons/3/30/Douglas-Peucker_animated.gif
   * The wiki article: http://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
   * Based on:  http://www.codeproject.com/Articles/18936/A-Csharp-Implementation-of-Douglas-Peucker-Line-Ap
   * @param pts Points to reduce
   * @param error Maximum distance of a point to a line. Low values (~2-4) work well for mouse/touchscreen data.
   * @returns A new list containing only the points needed to approximate the curve.
   */
  protected static RdpReduce(pts: Vector[], error: number): Vector[] {
    if (pts == null) { throw new Error('pts'); }
    pts = this.RemoveDuplicates(pts);

    if (pts.length < 3) {
      return [...pts];
    }

    const keepIndex: number[] = [];
    keepIndex.push(0);
    keepIndex.push(pts.length - 1);
    this.RdpRecursive(pts, error, 0, pts.length - 1, keepIndex);
    keepIndex.sort();
    const res: Vector[] = [];
    // ReSharper disable once LoopCanBeConvertedToQuery
    for (const idx of keepIndex) {
      res.push(pts[idx]);
    }

    return res;
  }

  /**
   * Removes any repeated points (that is, one point extremely close to the previous one). The same point can
   * appear multiple times just not right after one another. This does not modify the input list. If no repeats
   * were found, it returns the input list; otherwise it creates a new list with the repeats removed.
   * @param pts Initial list of points.
   * @returns Either pts (if no duplicates were found), or a new list containing pts with duplicates removed.
   */
  protected static RemoveDuplicates(pts: Vector[]): Vector[] {
    if (pts.length < 2) {
      return pts;
    }

    // Common case -- no duplicates, so just return the source list
    let prev = pts[0];
    const len = pts.length;
    let nDup = 0;
    for (let i = 1; i < len; i++) {
      const cur = pts[i];
      if (prev.equals(cur)) {
        nDup++;
      } else {
        prev = cur;
      }
    }

    if (nDup === 0) {
      return pts;
    } else {
      // Create a copy without them
      const dst: Vector[] = [];
      prev = pts[0];
      dst.push(prev);
      for (let i = 1; i < len; i++) {
        const cur = pts[i];
        if (!prev.equals(cur)) {
          dst.push(cur);
          prev = cur;
        }
      }
      return dst;
    }
  }

  /**
   * Finds the shortest distance between a point and a line. See: http://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
   * @param a First point of the line.
   * @param b Last point of the line.
   * @param abDist Distance between a and b (length of the line).
   * @param aCrossB "a.X*b.Y - b.X*a.Y" This would be the Z-component of (⟪a.X, a.Y, 0⟫ ⨯ ⟪b.X, b.Y, 0⟫) in 3-space.
   * @param p The point to test.
   * @returns The perpendicular distance to the line.
   */
  private static PerpendicularDistance(a: Vector, b: Vector, abDist: number, aCrossB: number, p: Vector): number {
    // A profile with the test data showed that originally this was eating up ~44% of the runtime. So, this went through
    // several iterations of optimization and staring at the disassembly. I tried different methods of using cross
    // products, doing the computation with larger vector types, etc... this is the best I could do in ~45 minutes
    // running on 3 hours of sleep, which is all scalar math, but RyuJIT puts it into XMM registers and does
    // ADDSS/SUBSS/MULSS/DIVSS because that's what it likes to do whenever it sees a vector in a function.
    const area = Math.abs(aCrossB + b.x * p.y + p.x * a.y - p.x * b.y - a.x * p.y);
    return area / abDist;
  }
}
