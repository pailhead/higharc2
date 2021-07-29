import { Ray } from './Ray'
import { IVec2 } from './types'

const WORK_VEC: IVec2 = [0, 0]

export class HalfEdge {
  next: HalfEdge | null = null
  prev: HalfEdge | null = null
  twin: HalfEdge | null = null
  face: number | null = null

  public readonly key: string

  constructor(
    public start: number,
    public end: number,
    private _vertices: IVec2[],
  ) {
    this.key = `${start}_${end}`
  }

  /**
   * Intersects a ray and writes the intersection point into target,
   * returns null if no intersection
   * @param ray
   * @param target destination where to write the result
   * @returns target or null
   */
  intersectRay(ray: Ray, target: IVec2) {
    //edge
    const s0 = this._vertices[this.start]
    const e0 = this._vertices[this.end]

    const a0 = e0[1] - s0[1]
    const b0 = s0[0] - e0[0]
    const c0 = a0 * s0[0] + b0 * s0[1]

    //ray
    const s1 = ray.point
    const e1 = WORK_VEC
    e1[0] = s1[0] + ray.dir[0]
    e1[1] = s1[1] + ray.dir[1]

    const a1 = e1[1] - s1[1]
    const b1 = e1[0] - s1[0]
    const c1 = a1 * s1[0] + b1 * s1[1]

    const det = a0 * b1 - a1 * b0

    if (det === 0) {
      //check if colinear
    } else {
      const x = (b1 * c0 - b0 * c1) / det
      const y = (a0 * c1 - a1 * c0) / det
      const h = Math.min(s0[0], e0[0]) <= x && x <= Math.max(s0[0], e0[0])
      const v = Math.min(s0[1], e0[1]) <= y && y <= Math.max(s0[1], e0[1])
      if (!h || !v) return null

      const dx = x - s1[0]
      const dy = y - s1[1]
      if (dx * ray.dir[0] + dy * ray.dir[1] > 0) {
        target[0] = x + 0
        target[1] = y + 0
        return target
      }
    }

    return null
  }
}
