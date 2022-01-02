

function ViewPersister(cameras) {
    
if(true){
    try {
        let state = JSON.parse(localStorage.viewpointPersistence)
        cameras.current.position.copy(state.camera)
        cameras.orbitControls.target.copy(state.controls)
        if(state.ortho&&camera.current.isOrthographicCamera){
            camera.zoom = state.ortho.zoom;
        }
    } catch {
        delete localStorage.viewpointPersistence
    }
}
    window.addEventListener('beforeunload', ()=>{
        let state={
            camera: cameras.current.position.clone(),
            controls: cameras.orbitControls.target.clone()
        }
        if(cameras.current.isOrthographicCamera){
            state.ortho={
                zoom:cameras.current.zoom
            }
        }
        localStorage.viewpointPersistence = JSON.stringify(state)
    }
    )
}


export default ViewPersister