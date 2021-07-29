import { IVec2 } from './types'

/**
 * Bounding box defined by start and size
 */
export class BoundingBox {
  position: IVec2 = [0, 0]
  size: IVec2 = [0, 0]

  containsPoint(point: IVec2) {
    const { position, size } = this
    const h = point[0] >= position[0] && point[0] < position[0] + size[0]
    const v = point[1] >= position[1] && point[1] < position[1] + size[1]
    return h && v
  }
}
