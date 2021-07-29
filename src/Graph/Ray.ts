import { IVec2 } from './types'

export class Ray {
  public readonly point: IVec2
  public readonly dir: IVec2

  constructor(point: IVec2, dir: IVec2) {
    this.point = [...point] as IVec2
    const length = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1])
    this.dir = [...dir].map((v) => v / length) as IVec2
  }
}
