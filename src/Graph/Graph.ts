/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Face } from './Face'
import { HalfEdge } from './HalfEdge'
import { IVec2 } from './types'

/**
 * graph class that computes polygons based on vertices and edges
 */
export class Graph {
  private _halfEdgeMap: Map<number, Map<number, HalfEdge>>
  private _faces: Face[]

  constructor(
    public readonly vertices: IVec2[],
    public readonly edges: IVec2[],
  ) {
    this._halfEdgeMap = this._getHalfEdgeMap(edges)
    this._faces = this._generateFaces()
  }

  getFaces() {
    return this._faces
  }

  /**
   * walk connected faces starting from an index
   * @param startFaceIndex
   * @param cb
   */
  bfsFace(startFaceIndex: number, cb: (face: Face, level: number) => void) {
    const queue: number[] = [startFaceIndex]
    const visited: Map<number, boolean> = new Map()
    const p = (index: number) => {
      if (visited.has(index)) return
      visited.set(index, true)
      const face = this._faces[index]
      cb(face, level)
      face.edges.forEach((halfEdge) => {
        if (halfEdge.twin && !visited.has(halfEdge.twin.face!))
          queue.push(halfEdge.twin.face!)
      })
    }
    let level = 0
    while (queue.length) {
      let items = queue.length
      while (items--) p(queue.shift()!)
      level++
    }
  }

  /**
   * create a half edge map from edge indices
   *   O(n) time
   *   O(n) space
   *   n - number of edges
   * @param edges
   * @returns edges split into Half edges with twin connections
   */
  private _getHalfEdgeMap = (edges: IVec2[]) => {
    const edgeMap: Map<number, Map<number, HalfEdge>> = new Map()
    edges.forEach(([a, b]) => {
      if (!edgeMap.has(a)) edgeMap.set(a, new Map())
      if (!edgeMap.has(b)) edgeMap.set(b, new Map())
      const ab = new HalfEdge(a, b, this.vertices)
      const ba = new HalfEdge(b, a, this.vertices)
      ab.twin = ba
      ba.twin = ab
      edgeMap.get(a)!.set(b, ab)
      edgeMap.get(b)!.set(a, ba)
    })
    return edgeMap
  }

  /**
   * Given the half edge map, find enclosed faces
   * @returns
   */
  private _generateFaces() {
    // O(n) to build the half edges beforehand
    // O(n) to fill a pool of work edges
    const workEdges: Map<HalfEdge, boolean> = new Map()
    this._halfEdgeMap.forEach((halfEdges) =>
      halfEdges.forEach((he) => workEdges.set(he, true)),
    )
    const faces: Face[] = []

    //TODO: complexity
    while (workEdges.size) {
      const next = workEdges.keys().next().value as HalfEdge

      const faceIndices = this._findFace(next)
      const face = new Face(faces.length, this.vertices)

      faceIndices.forEach((vertexIndex, i) => {
        const next = (i + 1) % faceIndices.length
        const prev = (i + faceIndices.length - 1) % faceIndices.length
        const nextIndex = faceIndices[next]
        const prevIndex = faceIndices[prev]
        const halfEdge = this._halfEdgeMap.get(vertexIndex)!.get(nextIndex)!
        const prevHalfEdge = this._halfEdgeMap.get(prevIndex)!.get(vertexIndex)!
        halfEdge.prev = prevHalfEdge
        prevHalfEdge.next = halfEdge
        halfEdge.face = face.index
        face.edges.push(halfEdge)
        workEdges.delete(halfEdge)
      })

      //try to find the "null" face (made by the boundary)
      const sign = face.computeSign()

      //normal sign push (index was written before)
      if (sign > 0) {
        faces.push(face)
        continue
      }
      //otherwise don't push the face, and delete the edges referring to the index we didnt write
      face.edges.forEach((halfEdge) => {
        if (halfEdge.twin) halfEdge.twin.twin = null
        this._halfEdgeMap.get(halfEdge.start)!.delete(halfEdge.end)
      })
    }

    return faces
  }

  /**
   * Given a half edge in the graph, do a DFS following the angle sorted half edges
   * Not sure about complexity:
   *
   * dfs can go at worst case and visit all the vertices
   * however this path length may be as small as 3 and as large as the largest polygon
   *
   * @param startEdge
   * @returns
   */
  private _findFace(startEdge: HalfEdge) {
    const face: number[] = []
    const path = [startEdge.start]
    const p = (index: number) => {
      if (face.length) return
      if (index === startEdge.start) {
        //hit a cycle, backtrack the entire path and designate it a polygon
        path.forEach((backIndex) => face.unshift(backIndex))
        return
      }
      const sortedEdges = this._getSortedEdges(index, path[0])
      path.unshift(index)
      sortedEdges.forEach((halfEdge) => {
        if (halfEdge.end === path[0]) return
        p(halfEdge.end)
      })
      path.shift()
    }

    p(startEdge.end)

    return face
  }

  /**
   * Get connected half edges originating from a an edge (vertex, and previous vertex)
   * sorted to be "closest" angle wise to the originating edge
   *
   *   O(n log n) time
   *   O(n) space
   *   n - number of connected edges (i'm not sure how this relates to the graph)
   *
   * @param index vertex pivot (end of edge)
   * @param previousIndex  previous vertex (start of edge)
   * @returns an array of HalfEdges
   */
  private _getSortedEdges(index: number, previousIndex: number): HalfEdge[] {
    const sortedEdges: {
      angle: number
      halfEdge: HalfEdge
    }[] = []
    const { vertices } = this

    const edgesFromVertex = this._halfEdgeMap.get(index)!

    const prevDir = WORK_VEC0
    if (previousIndex !== undefined) {
      prevDir[0] = vertices[previousIndex][0] - vertices[index][0]
      prevDir[1] = vertices[previousIndex][1] - vertices[index][1]
      const l = 1 / Math.sqrt(prevDir[0] * prevDir[0] + prevDir[1] * prevDir[1])
      prevDir[0] *= l
      prevDir[1] *= l
    } else {
      //the order of the first one should not matter
      prevDir[0] = 0
      prevDir[1] = 1
    }

    edgesFromVertex.forEach((halfEdge, endIndex) => {
      if (endIndex === previousIndex) return
      const nextDir = WORK_VEC1
      nextDir[0] = vertices[endIndex][0] - vertices[index][0]
      nextDir[1] = vertices[endIndex][1] - vertices[index][1]
      const l = 1 / Math.sqrt(nextDir[0] * nextDir[0] + nextDir[1] * nextDir[1])
      nextDir[0] *= l
      nextDir[1] *= l

      const dot = prevDir[0] * nextDir[0] + prevDir[1] * nextDir[1]
      const det = nextDir[0] * prevDir[1] - nextDir[1] * prevDir[0]
      let angle = Math.atan2(det, dot)
      angle = angle < 0 ? angle + Math.PI * 2 : angle
      sortedEdges.push({
        halfEdge,
        angle,
      })
    })
    sortedEdges.sort((a, b) => a.angle - b.angle)
    return sortedEdges.map(({ halfEdge }) => halfEdge)
  }
}
const WORK_VEC0: IVec2 = [0, 0]
const WORK_VEC1: IVec2 = [0, 0]
