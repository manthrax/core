let {min,max} = Math;
export default function MultiCamera(THREE){
    let v3 = THREE.Vector3
    let tv0 = new v3();
    let self=this;
    self.minDistance = .1;
    self.maxDistance = 1000.;
    self.minZoom = .1
    self.maxZoom = 1000.
    self.zoom = 0;
    self.distance = self.minDistance;
    self.target = new v3()
    self.position = new v3()
    let csz = 10;
    self.orthoCamera=new THREE.OrthographicCamera(-csz,csz,csz,-csz,-1000,1000);
    self.camera = self.perspectiveCamera=new THREE.PerspectiveCamera(90,window.innerWidth / window.innerHeight,0.1,10000);

    let mc = {
        get maxZoom(){return self.maxZoom},
        get maxDistance(){return this.maxZoom},
        get position(){return self.camera.position},
        set cameraType(nt){
            self.camera = ((self.type = nt).indexOf('ortho')==0) ? self.orthoCamera : self.perspectiveCamera;
        },
        get camera(){return self.camera},
        update(){
            self.zoom = max(self.minZoom,min(self.zoom,self.maxZoom));
            self.distance = max(self.minDistance,min(self.distance,self.maxDistance));
            self.camera.lookAt(self.target)
            self.camera.updateMatrixWorld()
            tv0.set(0,0,1).applyQuaternion(self.camera.quaternion);
            tv0.multiplyScalar(self.distance)
            self.camera.position.copy(self.target).sub(tv0);
        },
        setSize(width,height){
            //self.orthoCamera.aspect = 
            self.perspectiveCamera.aspect = width / height;
            self.orthoCamera.left=-width;
            self.orthoCamera.right=width;
            self.orthoCamera.bottom=-height;
            self.orthoCamera.top=height;
            self.orthoCamera.updateProjectionMatrix();
            self.perspectiveCamera.updateProjectionMatrix();            
        }
    }
    mc.cameraType='perspective'

    return mc;
}

export {MultiCamera};