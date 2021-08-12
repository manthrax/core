

function ViewPersister(camera, controls) {
    try {
        let state = JSON.parse(localStorage.viewpointPersistence)
        camera.position.copy(state.camera)
        controls.target.copy(state.controls)
        if(state.ortho&&camera.isOrthographicCamera){
            camera.zoom = state.ortho.zoom;
        }
    } catch {
        delete localStorage.viewpointPersistence
    }
    window.addEventListener('beforeunload', ()=>{
        let state={
            camera: camera.position.clone(),
            controls: controls.target.clone()
        }
        if(camera.isOrthographicCamera){
            state.ortho={
                zoom:camera.zoom
            }
        }
        localStorage.viewpointPersistence = JSON.stringify(state)
    }
    )
}


export default ViewPersister