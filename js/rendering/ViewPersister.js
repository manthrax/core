

function ViewPersister(camera, controls) {
    try {
        let state = JSON.parse(localStorage.viewpointPersistence)
        camera.position.copy(state.camera)
        controls.target.copy(state.controls)
    } catch {
        delete localStorage.viewpointPersistence
    }
    window.addEventListener('beforeunload', ()=>{
        localStorage.viewpointPersistence = JSON.stringify({
            camera: camera.position.clone(),
            controls: controls.target.clone()
        })
    }
    )
}


export default ViewPersister