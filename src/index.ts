/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Mesh, MeshBasicMaterial, Vector3 } from 'three'
import * as dat from 'dat.gui'
import { Viewer } from './Viewer'
import { IVec2 } from './Graph/types'
import { Graph } from './Graph/Graph'
import { Face } from './Graph/Face'
import { GraphViz } from './Viz/GraphViz'
import { DataViz } from './Viz/DataViz'
import { BoundingBoxViz } from './Viz/BoundingBoxViz'
import { Data } from './data/'

// poor mans test framework ================================================================================
const testEl = document.createElement('div')
testEl.style.position = 'absolute'
testEl.style.left = '0px'
testEl.style.top = '0px'
testEl.style.fontFamily = 'monospace'
testEl.style.color = 'white'
testEl.style.padding = '12px'
testEl.style.fontSize = '16px'
document.body.append(testEl)

const testMsgEl = document.createElement('div')
testEl.append(testMsgEl)

const hoverEl = document.createElement('div')
testEl.append(hoverEl)

const hoverNbrsEl = document.createElement('div')
testEl.append(hoverNbrsEl)

const hoverBFSEl = document.createElement('div')
testEl.append(hoverBFSEl)

const setHoverMsg = (newFace: number) => {
  hoverEl.innerHTML = `Hover index - ${newFace > -1 ? newFace : 'none'}`
}

const setHoverNbrs = (face: Face | null) => {
  const nbrs = face?.getAdjacentFaceIndices() ?? []
  if (!nbrs.length) {
    hoverNbrsEl.innerHTML = `No neighbors`
  } else {
    hoverNbrsEl.innerHTML = `Neighbors [${nbrs.join(',')}]`
  }
}

const setHoverBFS = (visits: number[][]) => {
  if (!visits.length) {
    hoverBFSEl.innerHTML = `No BFS`
  } else {
    const v = visits
      .map((l) => `[${l.join(',')}]`)
      .map((v) => `  ${v}`)
      .join('<br>')
    hoverBFSEl.innerHTML = `BFS visits: <br>${v}`
  }
}

//some dat gui stuff ================================================================================
const dataOptions = Object.keys(Data)
const guiState = { showBB: false, data: dataOptions[0] }

const viewer = new Viewer()
const dataViz = new DataViz()
const boundingBoxViz = new BoundingBoxViz()
const graphViz: GraphViz = new GraphViz()

let graph: Graph | null = null

viewer.scene.add(dataViz)
viewer.scene.add(boundingBoxViz)

viewer.animate()

//mouse interaction ================================================================================

const mouse = new Vector3()
const point = [0, 0] as IVec2

let intersectedFace = -1
const hsl = { h: 0, s: 0, l: 0 }

setHoverMsg(-1)

const doAlgorithm4 = (graph: Graph, newFace: number) => {
  const visits: number[][] = []
  graph?.bfsFace(newFace, (face, level) => {
    if (!visits[level]) visits[level] = []
    visits[level].push(face.index)
  })
  return visits
}

const setIntersectedFace = (newFace: number) => {
  intersectedFace = newFace
  if (newFace > -1) {
    setHoverNbrs(graph!.getFaces()[newFace]!)
    const visits = doAlgorithm4(graph!, newFace)
    setHoverBFS(visits)
    const vl = visits.length - 1
    visits.forEach((level, i) => {
      level.forEach((faceIndex) => {
        const m = graphViz?.draw.children[faceIndex] as Mesh
        ;(m.material as MeshBasicMaterial).color.setStyle(m.userData.hlColor)
        ;(m.material as MeshBasicMaterial).color.getHSL(hsl)
        ;(m.material as MeshBasicMaterial).color.setHSL(
          hsl.h,
          vl ? 1 - (hsl.s * i) / vl : 1,
          hsl.l,
        )
      })
    })
  } else {
    graph?.getFaces().forEach((f, i) => {
      const m = graphViz?.draw.children[i] as Mesh
      ;(m.material as MeshBasicMaterial).color.setStyle(m.userData.defaultColor)
    })
    setHoverNbrs(null)
    setHoverBFS([])
  }
  setHoverMsg(newFace)
}

document.addEventListener('mousemove', (evt) => {
  if (!graph) return
  mouse.set(evt.clientX, evt.clientY, 0)
  mouse.x /= viewer.size.x
  mouse.y /= viewer.size.y
  mouse.x = mouse.x * 2 - 1
  mouse.y = -mouse.y * 2 + 1
  mouse.unproject(viewer.camera)
  point[0] = mouse.x
  point[1] = mouse.y

  let newIntersectedFace = -1
  const faces = graph.getFaces()
  faces.forEach((face, i) => {
    boundingBoxViz.children[i].visible = false
    if (newIntersectedFace > -1) return
    if (face.containsPoint(point)) {
      boundingBoxViz.children[i].visible = guiState.showBB
      newIntersectedFace = i
    }
  })
  if (newIntersectedFace === intersectedFace) return
  setIntersectedFace(newIntersectedFace)
})

// dat gui ================================================================================
const onDataChange = (value: string) => {
  const data = Data[value]
  const { vertices, edges, expectFaceCount } = data
  dataViz.setupDataViz(vertices, edges)

  if (graphViz) {
    viewer.scene.remove(graphViz)
    graphViz.dispose()
  }

  graph = new Graph(vertices, edges)
  viewer.scene.add(graphViz)
  graphViz.setGraph(graph)
  boundingBoxViz.setGraph(graph)
  const faceCount = graph.getFaces().length
  const pass = expectFaceCount === faceCount ? 'PASS' : 'FAIL'
  const msg = `Polygon count should be ${expectFaceCount}, actual ${faceCount} ${pass}`
  testMsgEl.innerHTML = msg
}

onDataChange(guiState.data)

const gui = new dat.GUI()
gui.add(guiState, 'showBB').name('show bb on hover')
gui.add(guiState, 'data', dataOptions).onChange(onDataChange)
