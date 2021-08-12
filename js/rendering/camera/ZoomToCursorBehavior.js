let {max,min}=Math;
export default function ZoomToCursorBehavior({THREE,controls,renderer}){
    controls.enableZoom = false;
    //controls.enabled = false
    let mouseRay=new THREE.Vector3()
    let tv0=new THREE.Vector3()
    this.zoomSpeed = 2.;
    let sumDelta = 0;
    window.addEventListener('wheel',(e)=>{
        if(e.target!==renderer.domElement) return
        mouseRay.set((event.clientX / window.innerWidth) * 2 - 1,-(event.clientY / window.innerHeight) * 2 + 1, 0.1);
        sumDelta += event.deltaY;
    },false)
    this.update=(camera)=>{

        if(!sumDelta) return;

        tv0.copy(mouseRay);
        tv0.unproject(camera);
        tv0.sub(camera.position);

        tv0.setLength(this.zoomSpeed).multiplyScalar(sumDelta<0?1:-1);

        if(camera.isOrthographicCamera){
            (!camera.targetZoom) && (camera.targetZoom=camera.zoom);
            camera.zoom = min(100,max(.001,camera.zoom+(sumDelta*-.01)));
            camera.updateProjectionMatrix();
        }else{
            if(sumDelta>0)
                tv0.set(0,0,1).applyQuaternion(camera.quaternion)
            tv0.setLength(this.zoomSpeed);//.multiplyScalar(-1);
        }
        if(!camera.targetImpulse)camera.targetImpulse=tv0.clone()
        camera.targetImpulse.add(tv0)
        controls.targetImpulse.add(tv0)
        //controls.enabled = false
        sumDelta = 0;
    }
}
