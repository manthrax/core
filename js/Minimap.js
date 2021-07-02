

export default function Minimap(app){
    let {THREE,renderer,camera,scene} = app;
    let minicam = camera.clone()
    let saveViewport = new THREE.Vector4()
    scene.add(minicam);
    minicam.aspect = 1.;
    minicam.updateProjectionMatrix();
    let size = 300;
    let targetObject
    let v=new THREE.Vector3()
    let localCenter=new THREE.Vector3()
    let worldCenter=new THREE.Vector3()
    let self;
    let bnds = new THREE.Box3()
    let orbitRadius=10;
    document.addEventListener('object-clicked',e=>{
        self.target = e.detail.object.view;
    })
    document.addEventListener('after-render',e=>{
        if(targetObject){
            targetObject.localToWorld(worldCenter.copy(localCenter));

            minicam.position.add(v.set(-.001,.0,0).multiplyScalar(orbitRadius).applyQuaternion(minicam.quaternion));
            v.copy(minicam.position).sub(worldCenter)
            v.multiplyScalar(orbitRadius/v.length());
            minicam.position.copy(worldCenter).add(v)

            //minicam.up=v.set(0,1,0).applyQuaternion(minicam.quaternion)

            minicam.lookAt(worldCenter)
        }else{
            if(Math.random()<0.01){
                minicam.position.copy(camera.position)
                minicam.rotation.copy(camera.rotation)
            }
        }
        renderer.getViewport(saveViewport)
        renderer.setViewport(saveViewport.z-size,saveViewport.w-size,250,250)
        renderer.autoClearColor = false;
        renderer.render(scene, minicam);
        renderer.setViewport(saveViewport)
        renderer.autoClearColor = true;
    })
    let update = ()=>{
        
    }
    self = {
        update,
        set target(object){
            targetObject = object;
            bnds.setFromObject(object);
            object.worldToLocal(bnds.getCenter(localCenter));
            orbitRadius = v.copy(bnds.max).sub(bnds.min).length()*.5;
            v.y*=4;
            minicam.position.copy(v.add(object.position))
        }
    }
    return self;
}