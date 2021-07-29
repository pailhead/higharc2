import { OrthographicCamera, Scene, Vector2, WebGLRenderer } from 'three'

/**
 * a wrapper around three's scene and renderer
 */
export class Viewer {
  public readonly scene = new Scene()
  public readonly camera = new OrthographicCamera(-1, 1, 1, -1, 1, 10)
  public readonly renderer = new WebGLRenderer({ antialias: true })
  public readonly size = new Vector2()

  constructor() {
    this.camera.zoom = 200
    this.camera.position.z = 5

    document.body.appendChild(this.renderer.domElement)
    document.body.style.margin = '0px'

    window.addEventListener('resize', this._onResize)
    this._onResize()
  }
  animate = () => {
    requestAnimationFrame(this.animate)
    this.renderer.render(this.scene, this.camera)
  }
  private _onResize = () => {
    this.size.set(window.innerWidth, window.innerHeight)
    const wh = window.innerWidth / 2
    const hh = window.innerHeight / 2
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.camera.left = -wh
    this.camera.right = wh
    this.camera.top = hh
    this.camera.bottom = -hh
    this.camera.updateProjectionMatrix()
  }
}
