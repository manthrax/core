import*as THREE from "https://threejs.org/build/three.module.js";
import {OrbitControls} from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import PushCameraBehavior from "./PushCameraBehavior.js"
import CameraShake from "./CameraShake.js"
import MouseRaycaster from "./MouseRaycaster.js"
import MultiCamera from "./MultiCamera.js"

let {PI,min,max} = Math;
function CameraControls({scene,renderer}){
    
    let multiCamera = this.multiCamera = new MultiCamera(THREE)
    let camera = multiCamera.camera;

    //this.getCamera = ()=>{return this.multiCamera.camera;}

    let cameraShake = new CameraShake({
        THREE,
        camera,renderer
    }).enabled = true;
    
    let raycaster = new MouseRaycaster(THREE);


    let controls = this.orbitControls = new OrbitControls(camera,renderer.domElement);
    //  controls.autoRotate= true
    //  controls.autoRotateSpeed = 1

    controls.minDistance = 1.5;
    controls.maxDistance = 14.5;
    controls.minPolarAngle = PI * .01;
    controls.maxPolarAngle = PI * .49;
    controls.enabled = true;


    let pushCameraBehavior = this.pushCameraBehavior = new PushCameraBehavior({
        THREE,
        cameraControls:this,
        renderer,
        controls
    })

let enabled = this.enabled = true;
this.setEnabled = (tf)=>{
  enabled = this.enabled = tf;
  controls.enabled = tf;
}
    window.addEventListener("keyup", e=>(!e.ctrlKey) && enabled && (controls.enabled = true))
    window.addEventListener("keydown", e=>(e.ctrlKey) && (controls.enabled = false))

let targetMarker = new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:'yellow'}));

//scene.add(targetMarker)
let tv0 = new THREE.Vector3()

    let applyImpulse=(imp,to,accel)=>{
        tv0.copy(imp).multiplyScalar(accel)
        to.add(tv0)
        imp.sub(tv0)
    }

camera.targetImpulse=new THREE.Vector3(0,0,0);
controls.targetImpulse=new THREE.Vector3(0,0,0);

let vec3 = THREE.Vector3;
let nv0=new vec3();
    let mrad = 1000
    let pmin = new vec3(-mrad,-Infinity,-mrad);
    let pmax = new vec3(mrad,Infinity,mrad);
    let limit = (v)=>{
        
        v.set(max(pmin.x, v.x), max(pmin.y, v.y), max(pmin.z, v.z))
        v.set(min(pmax.x, v.x), min(pmax.y, v.y), min(pmax.z, v.z))
    }

    this.update = ()=>{

if(!enabled) return;

        (camera.targetImpulse) && applyImpulse(camera.targetImpulse,camera.position,.1);
        (controls.targetImpulse) && applyImpulse(controls.targetImpulse,controls.target,.1);
        if(controls.target.y<camera.position.y){//!=0){
            let ax = controls.target.y - camera.position.y;
            let bx = camera.position.y;
            let v = targetMarker.position;
            v.copy(controls.target)
            v.sub(camera.position).multiplyScalar(bx/-ax).add(camera.position)
            targetMarker.position.copy(v)

            v.sub(controls.target)
            controls.target.add(v)
           // camera.position.add(v)
        }
        pushCameraBehavior.update()

    //limit(camera.position)

nv0.copy(camera.position).sub(controls.target);
    limit(controls.target)
//controls.target.y = max(3,controls.target.y);
    
//nv0.y = max(.1,nv0.y);
camera.position.copy(controls.target).add(nv0)

        controls.update()



    }
}

Object.defineProperty(CameraControls.prototype, 'cameraType', {
  get() {
    return this.multiCamera.cameraType;
  },
  set(value) {
    this.multiCamera.cameraType=value
    this.orbitControls.object = this.camera;
  }
});

Object.defineProperty(CameraControls.prototype, 'camera', {
  get() {
    return this.multiCamera.camera;
  },
  set(value) {
      throw "Can't set camera directly.."
  }
});

export {CameraControls,MultiCamera};