/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BoundingBox } from './BoundingBox'
import { HalfEdge } from './HalfEdge'
import { Ray } from './Ray'
import { IVec2 } from './types'

const RAY_DIR: IVec2 = [1, 0]
const WORK_RAY = new Ray([0, 0], RAY_DIR)
const WORK_VEC: IVec2 = [0, 0]
const EPS = 0.000001

/**
 * Face class
 */
export class Face {
  public readonly edges: HalfEdge[] = []
  public readonly boundingBox = new BoundingBox()

  constructor(public index: number, private _vertices: IVec2[]) {}

  /**
   * Try to figure out the direction the polygon is poinging to (to eliminate the boundary face)
   * try "newell's method" https://www.khronos.org/opengl/wiki/Calculating_a_Surface_Normal
   */
  computeSign() {
    let sign = 0
    this.edges.forEach((edge, i) => {
      const nextEdge = this.edges[(i + 1) % this.edges.length]
      const vCurr = this._vertices[edge.start]
      const vNext = this._vertices[nextEdge.start]
      sign += (vCurr[0] - vNext[0]) * (vCurr[1] + vNext[1])
    })
    return sign
  }

  getAdjacentFaceIndices() {
    const res: number[] = []
    this.edges.forEach((halfEdge) => {
      const { twin } = halfEdge
      if (twin) res.push(twin.face!)
    })
    return res
  }

  /**
   * Computes bounding box of the face, for coarse intersection
   */
  computeBoundingBox() {
    const min = [Infinity, Infinity] as IVec2
    const max = [-Infinity, -Infinity] as IVec2

    this.edges.forEach((halfEdge) => {
      const startVert = this._vertices[halfEdge.start]
      min[0] = Math.min(min[0], startVert[0])
      min[1] = Math.min(min[1], startVert[1])
      max[0] = Math.max(max[0], startVert[0])
      max[1] = Math.max(max[1], startVert[1])
    })

    this.boundingBox.position = min
    this.boundingBox.size = [max[0] - min[0], max[1] - min[1]]
    return this.boundingBox
  }

  /**
   * count number of times a ray originating from a point intersects polygon edges
   * @param point
   */
  containsPoint(point: IVec2) {
    let intersectionCount = 0
    WORK_RAY.point[0] = point[0]
    WORK_RAY.point[1] = point[1]
    const map: Map<string, HalfEdge> = new Map()
    this.edges.forEach((halfEdge) => {
      const intersection = halfEdge.intersectRay(WORK_RAY, WORK_VEC)
      if (intersection === null) return
      const key = `${intersection[0]}_${intersection[1]}`

      //if already contains this intersection, move the ray
      //slightly perpendicular to its dirand check both edges
      if (map.has(key)) {
        WORK_RAY.point[1] = point[1] + EPS
        const intersectedEdge = map.get(key)!
        if (!intersectedEdge.intersectRay(WORK_RAY, WORK_VEC))
          intersectionCount--
        if (halfEdge.intersectRay(WORK_RAY, WORK_VEC)) intersectionCount++
        WORK_RAY.point[1] = point[1]
        return
      }
      map.set(key, halfEdge)
      intersectionCount++
    })
    return Boolean(intersectionCount % 2)
  }
}
