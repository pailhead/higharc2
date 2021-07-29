/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  IncrementWrapStencilOp,
  Mesh,
  MeshBasicMaterial,
  NotEqualStencilFunc,
  Object3D,
} from 'three'
import { Graph } from '../Graph/Graph'

const stencilMaterial = new MeshBasicMaterial({
  side: DoubleSide,
  colorWrite: false,
  depthWrite: false,
  depthTest: false,
  stencilWrite: true,
  stencilZPass: IncrementWrapStencilOp,
})

export class GraphViz extends Group {
  draw = new Group()
  stencil = new Group()

  private _geometry = new BufferGeometry()
  private _remove: Object3D[] = []

  constructor() {
    super()
    this.add(this.draw)
    this.add(this.stencil)
  }

  dispose() {
    while (this._remove.length) {
      const o = this._remove.pop()!
      o?.parent?.remove(o)
    }
  }

  setGraph(graph: Graph) {
    this._geometry.dispose()

    const indices: number[] = []
    const positions: number[] = []
    graph.vertices.forEach((v) => {
      positions.push(...v, 0)
    })
    const positionArray = new Float32Array(positions)

    let offset = 0
    graph.getFaces().forEach((face, i) => {
      for (let i = 1; i < face.edges.length - 1; i++) {
        indices.push(
          face.edges[0].start,
          face.edges[i].start,
          face.edges[i].end,
        )
      }

      const color = '#888'
      const renderMesh = new Mesh(
        this._geometry,
        new MeshBasicMaterial({
          color,
          stencilFunc: NotEqualStencilFunc,
          stencilFuncMask: 1,
          stencilWrite: true,
        }),
      )

      renderMesh.userData.defaultColor = color
      renderMesh.userData.hlColor = '#ffff00'

      const stencilMesh = new Mesh(this._geometry, stencilMaterial)

      renderMesh.renderOrder = -i * 2
      stencilMesh.renderOrder = -i * 2 - 1

      const count = (face.edges.length - 2) * 3
      const _offset = offset
      const onBeforeRender = (
        _r: unknown,
        _s: unknown,
        _c: unknown,
        geometry: BufferGeometry,
      ) => {
        geometry.drawRange.start = _offset
        geometry.drawRange.count = count
      }

      offset += count

      renderMesh.onBeforeRender = onBeforeRender
      stencilMesh.onBeforeRender = onBeforeRender

      this.draw.add(renderMesh)
      this.stencil.add(stencilMesh)
      this._remove.push(renderMesh)
      this._remove.push(stencilMesh)
    })

    this._geometry.setIndex(new BufferAttribute(new Uint16Array(indices), 1))
    this._geometry.setAttribute(
      'position',
      new BufferAttribute(positionArray, 3),
    )
  }
}
