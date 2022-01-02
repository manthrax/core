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
    self.perspectiveCamera=new THREE.PerspectiveCamera(90,window.innerWidth / window.innerHeight,0.1,10000);

	self.cameraRig = self.perspectiveCamera.clone();
	self.cameraRig.add(self.perspectiveCamera)
	self.cameraRig.add(self.orthoCamera)
    self.camera = self.cameraRig;
    self.activeCamera = self.perspectiveCamera;
//let {DEG2RAD} = THREE;

const DEG2RAD = Math.PI / 180;
    let updateProjectionMatrixHorizontalFOV = (camera)=>{

		const near = camera.near;
/*
		let top = near * Math.tan( DEG2RAD * 0.5 * camera.fov ) / camera.zoom;
		let height = 2 * top;
		let width = camera.aspect * height;
		let left = - 0.5 * width;
*/

		let left = -near * Math.tan( DEG2RAD * 0.5 * camera.fov ) / camera.zoom;
		let width = -2 * left;
		let height = width / camera.aspect ;
		let top = 0.5 * height;

		const view = camera.view;

		if ( camera.view !== null && camera.view.enabled ) {

			const fullWidth = view.fullWidth,
				fullHeight = view.fullHeight;

			left += view.offsetX * width / fullWidth;
			top -= view.offsetY * height / fullHeight;
			width *= view.width / fullWidth;
			height *= view.height / fullHeight;

		}

		const skew = camera.filmOffset;
		if ( skew !== 0 ) left += near * skew / camera.getFilmWidth();

		camera.projectionMatrix.makePerspective( left, left + width, top, top - height, near, camera.far );

		camera.projectionMatrixInverse.copy( camera.projectionMatrix ).invert();

	}


    self.perspectiveCamera.fovAxis = 'horizontal'
    
    let mc = {
        get activeCamera(){return self.activeCamera},
        get maxZoom(){return self.maxZoom},
        get maxDistance(){return this.maxZoom},
        get position(){return self.cameraRig.position},
        set cameraType(nt){
            self.activeCamera = ((self.type = nt).indexOf('ortho')==0) ? self.orthoCamera : self.perspectiveCamera;
        },
        get cameraRig(){return self.cameraRig},
        //get camera(){return self.cameraRig},
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

            if(self.perspectiveCamera.fovAxis==='horizontal')
                updateProjectionMatrixHorizontalFOV(self.perspectiveCamera)
            else
                self.perspectiveCamera.updateProjectionMatrix();            
        }
    }
    mc.cameraType='ortho' //
    mc.cameraType='perspective'

    return mc;
}

export {MultiCamera};