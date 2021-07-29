import {
  BufferAttribute,
  BufferGeometry,
  Group,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
} from 'three'
import { IVec2 } from '../Graph/types'

export class DataViz extends Group {
  private _remove: Object3D[] = []
  private _sphereGeometry = new SphereGeometry(0.05, 8, 4)
  private _pointMaterial = new MeshBasicMaterial({ color: '#0000ff' })
  private _edgeGeometry = new BufferGeometry()

  constructor() {
    super()
  }

  setupDataViz(vertices: IVec2[], edges: IVec2[]) {
    this.dispose()

    vertices.forEach((v) => {
      const p = new Mesh(this._sphereGeometry, this._pointMaterial)
      p.position.x = v[0]
      p.position.y = v[1]
      this.add(p)
      this._remove.push(p)
    })

    const position: number[] = []
    const index: number[] = []
    vertices.forEach((v) => position.push(...v, 0))
    edges.forEach((e) => index.push(...e))
    this._edgeGeometry.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(position), 3),
    )
    this._edgeGeometry.setIndex(new BufferAttribute(new Uint16Array(index), 1))
    const edgeLines = new LineSegments(this._edgeGeometry)
    edgeLines.position.z = 0.001
    this.add(edgeLines)
    this._remove.push(edgeLines)
  }

  dispose() {
    this._edgeGeometry.dispose()
    while (this._remove.length) {
      const prev = this._remove.pop()
      prev?.parent?.remove(prev)
    }
  }
}
