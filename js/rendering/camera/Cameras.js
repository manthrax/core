import {OrbitControls} from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
let {PI, min, max} = Math;

export class Cameras {
    constructor({THREE, scene, renderer}) {


        let w = window.innerWidth;
        let h = window.innerHeight;
        this.fovAxis = 'horizontal'
        this.perspectiveCamera = new THREE.PerspectiveCamera(90,w / h,0.01,1000);
        this.perspectiveCamera.updateProjectionMatrix = updateProjectionMatrixThrax
        this.orthoCamera = new THREE.OrthographicCamera(-w,w,h,-h,-1000,1000);
        this.current = this.perspectiveCamera;
        this.orbitControls = new OrbitControls(this.current,renderer.domElement)
        this.enabled = true;
        window.addEventListener("keyup", e=>(!e.ctrlKey) && (!e.shiftKey) && this.enabled && (this.orbitControls.enabled = true))
        window.addEventListener("keydown", e=>(e.ctrlKey || e.shiftKey) && (this.orbitControls.enabled = false))

        this.setSize = (w,h)=>{
            this.perspectiveCamera.aspect = w / h;
            this.perspectiveCamera.updateProjectionMatrix();
            this.orthoCamera.left = -w;
            this.orthoCamera.right = w;
            this.orthoCamera.bottom = -h;
            this.orthoCamera.top = h;
            this.orthoCamera.updateProjectionMatrix();
            return this;
        }
        this.update = ()=>{
            this.orbitControls.update()
            return this;
        }
    }
}



const DEG2RAD = Math.PI / 180;
function updateProjectionMatrixThrax() {
    const camera = this;
    const near = camera.near;
    let top, height, width, left;
    if (camera.fovAxis === 'vertical') {
        top = near * Math.tan(DEG2RAD * 0.5 * camera.fov) / camera.zoom;
        height = 2 * top;
        width = camera.aspect * height;
        left = -0.5 * width;
    } else {
        left = -near * Math.tan(DEG2RAD * 0.5 * camera.fov) / camera.zoom;
        width = -2 * left;
        height = width / camera.aspect;
        top = 0.5 * height;
    }
    const view = camera.view;
    if (camera.view !== null && camera.view.enabled) {
        const fullWidth = view.fullWidth
          , fullHeight = view.fullHeight;
        left += view.offsetX * width / fullWidth;
        top -= view.offsetY * height / fullHeight;
        width *= view.width / fullWidth;
        height *= view.height / fullHeight;
    }
    const skew = camera.filmOffset;
    if (skew !== 0)
        left += near * skew / camera.getFilmWidth();
    camera.projectionMatrix.makePerspective(left, left + width, top, top - height, near, camera.far);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
