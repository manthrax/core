import GridMat from "./GridMat.js"
import OutlineMaterial from "./OutlineMaterial.js"

export default function Editor({THREE, world, scene, camera}) {
    let {floor} = Math;
    let buttons;

    let v3 = THREE.Vector3;
    let dragStart = new v3();
    let dragEnd = new v3();
    let dragDelta = new v3();
    let dragProxy
    let dragObject

    let gridMat = new GridMat({
        THREE
    });

    let dragPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(world.gridSize * 20,world.gridSize * 20,2,2),gridMat)

    dragPlane.position.y = .1
    dragPlane.rotation.x = Math.PI * -.5

    const mouse = new THREE.Vector2();
    let raycaster = new THREE.Raycaster()

    let raycast = (e,grp,recursive=true)=>{

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera)
        return raycaster.intersectObjects(grp, recursive);
    }

    let outlineMaterial = new OutlineMaterial(new THREE.MeshBasicMaterial({
        color: 'orange',
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        opacity: .5
    }))
/*
    let outlinedViews={}
    let selectionChanged=()=>{

    }

    let meshes = []
    o.view.traverse(e=>(e.isMesh && e.material)&&meshes.push(e))
    meshes.forEach(e=>
        (!outlinedViews[e.uuid]) && (outlinedViews[e.uuid] = new THREE.Mesh(e.geometry,outlineMaterial)))
*/


    let select = (o,sel)=>{
        if (!sel) {
            world.select(o, false)
        } else {
            world.select(o, true)
        }
    }

    let vtfm = (v,f)=>v.set(f(v.x), f(v.y), f(v.z))

    let dragEvt

    let gridSz = world.gridSize / 126;
    //.1
    let moveSelectionPlane = (dragEnd)=>{
        vtfm(dragEnd, (e)=>floor((e / gridSz) + .5) * gridSz)
        dragPlane.position.copy(dragEnd);
    }
    let moveSelected = (dragDelta)=>{
        vtfm(dragDelta, (e)=>floor((e / gridSz) + .5) * gridSz)
        world.selection.forEach(o=>world.move(o, dragDelta))
    }

    let highlightMaterials = (root)=>{

        let hilightMats = {}
        let meshes = []
        root.traverse(e=>e.isMesh && meshes.push(e))
        meshes.forEach(e=>{
            if (!hilightMats[e.material.uuid]) {
                let m = e.material.clone()
                hilightMats[e.material.uuid] = m;
                m.transparent = true;
                m.color.set(WHITE);
                m.opacity = .27;
            }
            e.material = hilightMats[e.material.uuid]
        }
        )
    }

    let update = ()=>{

        if (dragEvt && dragEvt.ctrlKey && buttons) {
            const intersects = raycast(dragEvt, [dragPlane], false);
            for (let i = 0; i < intersects.length; i++) {
                dragEnd.copy(intersects[0].point)
                moveSelectionPlane(dragEnd)
                break
            }
        }
    }
    let vmove = new THREE.Vector3()

    function keydown(e) {
        if (e.code == 'NumpadAdd')
            moveSelected(vmove.set(0, gridSz, 0))
        if (e.code == 'NumpadSubtract')
            moveSelected(vmove.set(0, -gridSz, 0))
    }
    function mousemove(e) {
        dragEvt = e
    }
    function mouseup(e) {

        if (dragProxy && dragObject) {
            scene.attach(dragProxy)
            //       dragObject.position.copy(dragProxy.position)

            dragDelta.copy(dragEnd).sub(dragStart)

            if (e.ctrlKey && e.altKey && e.shiftKey) {
                let nsel = world.selection.map(v=>world.cloneObject(v))
                while (world.selection.length)
                    select(world.selection[0], false)
                let objs = nsel.map(obj=>world.objects[obj.userData.objectId])
                objs.forEach(obj=>world.addToSector(obj, obj.sector))
                objs.forEach(obj=>world.select(obj, true))
            }

            world.selection.forEach(v=>world.move(v, dragDelta))

            //            world.move(dragObject,dragDelta)

            // dragObject.view 
            dragPlane.parent && scene.remove(dragPlane)
            dragProxy.parent.remove(dragProxy)
            dragProxy = undefined
            buttons = e.buttons
        }
    }

    function mousedown(e) {
        buttons = e.buttons
        let intersects = raycast(e, scene.children)
        if (!e.shiftKey)
            while (world.selection.length)
                select(world.selection[0], false)
        for (let i = 0; i < intersects.length; i++) {
            let o = intersects[i].object
            while ((o != scene) && (o.userData.objectId == undefined))
                o = o.parent;
            let dob = world.objects[o.userData.objectId];
            (dob) && document.dispatchEvent(new CustomEvent('sim-object-clicked',{
                detail: {
                    object: dob
                }
            }));
            dragObject = dob

            if (!dragObject) {
                document.dispatchEvent(new CustomEvent('object-clicked',{
                    detail: {
                        object: intersects[i]
                    }
                }))
                break;
            }

            if (!e.ctrlKey)
                break;

            if (dragObject.flags & 1) {
                continue;
            }
            select(dragObject, true)

            dragStart.copy(intersects[i].point)
            dragEnd.copy(dragStart)
            dragPlane.position.copy(dragStart)
            scene.add(dragPlane)
            dragProxy = o.clone(true)

            o.parent.add(dragProxy)

            dragPlane.attach(dragProxy)

            break;
            //Only process first hit
        }
    }
    let ed = {

        set enabled(tf) {
            let fn = tf ? 'addEventListener' : 'removeEventListener'
            window[fn]("keydown", keydown)
            window[fn]("mousemove", mousemove)
            window[fn]("mouseup", mouseup)
            window[fn]("mousedown", mousedown)
        },
        update
    }
    ed.enabled = true;
    return ed;
}
