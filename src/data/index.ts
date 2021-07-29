/* eslint-disable @typescript-eslint/no-explicit-any */
import { IVec2 } from '../Graph/types'

import hSingle from './hSingle.json'
import quadWithEars from './quadWithEars.json'
import quadGrid from './quadGrid.json'
import singleQuad from './singleQuad.json'
import singleTriangle from './singleTriangle.json'
import splitQuad from './splitQuad.json'
import twoTriangles from './twoTriangles.json'
import hSplit from './hSplit.json'

export interface IData {
  expectFaceCount: number
  scale: number
  vertices: IVec2[]
  edges: IVec2[]
}

export const Data: Record<string, IData> = {
  quadGrid: quadGrid as any,
  hSingle: hSingle as any,
  quadWithEars: quadWithEars as any,
  singleQuad: singleQuad as any,
  singleTriangle: singleTriangle as any,
  splitQuad: splitQuad as any,
  hSplit: hSplit as any,
  twoTriangles: twoTriangles as any,
}
