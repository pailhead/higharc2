import {
  BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Object3D,
  PlaneBufferGeometry,
} from 'three'
import { Graph } from '../Graph/Graph'

export class BoundingBoxViz extends Group {
  private _planeGeometry = new PlaneBufferGeometry(1, 1, 1, 1)
  private _material = new LineBasicMaterial({ color: '#ff0000' })
  private _remove: Object3D[] = []
  constructor() {
    super()

    this._planeGeometry.translate(0.5, 0.5, 0)
    this._planeGeometry.setIndex(
      new BufferAttribute(new Uint16Array([0, 1, 1, 3, 3, 2, 2, 0]), 1),
    )
  }

  setGraph(graph: Graph) {
    this.dispose()
    graph.getFaces().forEach((face) => {
      const bb = face.computeBoundingBox()
      const m = new LineSegments(this._planeGeometry, this._material)
      m.position.set(bb.position[0], bb.position[1], 0.1)
      m.scale.set(bb.size[0], bb.size[1], 1)
      m.visible = false
      this.add(m)
      m.userData.boundingBox = bb
      this._remove.push(m)
    })
  }

  dispose() {
    while (this._remove.length) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const o = this._remove.pop()!
      this.remove(o)
    }
  }
}
