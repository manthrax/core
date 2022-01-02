export default function PushCameraBehavior({THREE,cameraControls, controls, renderer}) {
    let {min, max, abs} = Math;
    let vec3 = THREE.Vector3;
    let cx = new vec3()
    let cy = new vec3()
    let ct = new vec3()
    let velocity = 1;
    let mouseout = (e)=>{
        cx.set(0, 0, 0)
        cy.set(0, 0, 0)
    }
    let hasFocus = false;
    let mousemove = (mm)=>{
        if(mm.target!==renderer.domElement) return
        let camera = cameraControls.cameraRig;
        hasFocus = mm.target === renderer.domElement
        let nx = (mm.pageX / window.innerWidth) - .5
        let ny = (mm.pageY / window.innerHeight) - .5
        let magx = max(0, abs(nx) - .4) * velocity
        let magy = max(0, abs(ny) - .4) * velocity
        cx.set(0, 0, 0)
        cy.set(0, 0, 0)
        let vdist = ct.copy(camera.position, controls.target).length() * .1;
        magx *= vdist + .1;
        magy *= vdist + .1;
        if (magx > 0) {
            cx.set(1, 0, 0).applyQuaternion(camera.quaternion)
            cx.multiplyScalar(nx > 0 ? magx : -magx)
        }
        if (magy > 0) {
            cy.set(0, 0, 1).applyQuaternion(camera.quaternion)
            cy.y = 0;
            cy.normalize()
            cy.multiplyScalar(ny > 0 ? magy : -magy)
        }
    }    

    let update = ()=>{
        let camera = cameraControls.cameraRig;
        if (!hasFocus)
            return

        camera.position.add(cx).add(cy)
        controls.target.add(cx).add(cy)
    }
    
    let self = {
        set velocity(v) {
            velocity = parseFloat(v);
        },
        set enabled(tf) {
            let fn = tf ? "addEventListener" : "removeEventListener";
            document[fn]("mouseout", mouseout);
            window[fn]("mousemove", mousemove, false);
        },
        update
    }
    self.enabled = true;
    return self;
}
