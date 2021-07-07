export default function PushCameraBehavior({THREE,camera,controls}){
    let {max,abs}=Math;
    let cx = new THREE.Vector3()
    let cy = new THREE.Vector3()
    let ct = new THREE.Vector3()
    let mouseout=(e)=>{
        cx.set(0, 0, 0)
        cy.set(0, 0, 0)
    }
    let mousemove=(mm)=>{
        let nx = (mm.pageX / window.innerWidth) - .5
        let ny = (mm.pageY / window.innerHeight) - .5
        let magx = max(0, abs(nx) - .4) * 5
        let magy = max(0, abs(ny) - .4) * 5
        cx.set(0, 0, 0)
        cy.set(0, 0, 0)
        let vdist = ct.copy(camera.position,controls.target).length()*.1;
        magx *= vdist+.1;
        magy *= vdist+.1;
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
        camera.position.add(cx)
        controls.target.add(cx)
        camera.position.add(cy)
        controls.target.add(cy)
    }
    let self={
        set enabled(tf){
            let fn = tf?"addEventListener":"removeEventListener";
            document[fn]("mouseout", mouseout);
            window[fn]("mousemove", mousemove , false);
        },
        update
    }
    self.enabled = true;
    return self;
}
