import*as THREE from "https://threejs.org/build/three.module.js";
import {OrbitControls} from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import {GLTFLoader} from "https://threejs.org/examples/jsm/loaders/GLTFLoader.js";
import {RGBELoader} from "https://threejs.org/examples/jsm/loaders/RGBELoader.js";

import SkyEnv from "./SkyEnv.js"
import World from "./World.js"
import ProcGen from "./ProcGen.js"
//import*as Renderer from "./Renderer.js"
import Info from "./Info.js"

export default function Renderer() {

    let camera, scene, renderer, controls;
    let clock;

    let skyEnv;
    let world;

    let info = new Info(THREE);

    let skyChanged

    let cx = new THREE.Vector3()
    let cy = new THREE.Vector3()
    let {min, max, abs, PI, floor} = Math;
    let updateCamMove = ()=>{
        camera.position.add(cx)
        controls.target.add(cx)
        camera.position.add(cy)
        controls.target.add(cy)
    }

    let core = {}

    camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,0.1,1000);
    camera.position.copy({
        x: -0.7965422346052364,
        y: 1.656460008711307,
        z: -0.8481421792924781
    });
    camera.position.set(10, 10, 10);

    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        //alpha: true,
        //logarithmicDepthBuffer:true
    });

    //renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMapping = THREE.LinearToneMapping;
    //renderer.toneMapping = THREE.ReinhardToneMapping;
    //CineonToneMapping;//ReinhardToneMapping// 
    //LinearEncoding;//sRGBEncoding;

    //renderer.toneMapping = THREE.ACESFilmicToneMapping;
    //CineonToneMapping;//ReinhardToneMapping// 
    //LinearEncoding;//sRGBEncoding;
    renderer.toneMappingExposure = .1;

    //renderer.toneMappingExposure = .25;
    renderer.outputEncoding = THREE.sRGBEncoding

    renderer.setClearColor("black", 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera,renderer.domElement);
    //  controls.autoRotate= true
    //  controls.autoRotateSpeed = 1

    controls.minDistance = 1.5;
    controls.maxDistance = 14.5;
    controls.minPolarAngle = PI * .1;
    controls.maxPolarAngle = PI * .48;

    clock = new THREE.Clock();

    onWindowResize();
    window.addEventListener("resize", onWindowResize, false);

    document.addEventListener("mouseout", function(e) {
        cx.set(0, 0, 0)
        cy.set(0, 0, 0)
    });
    window.addEventListener("mousemove", (mm)=>{
        let nx = (mm.pageX / window.innerWidth) - .5
        let ny = (mm.pageY / window.innerHeight) - .5
        let magx = max(0, abs(nx) - .3) * 5
        let magy = max(0, abs(ny) - .3) * 5
        cx.set(0, 0, 0)
        cy.set(0, 0, 0)
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
    , false);

    const mouse = new THREE.Vector2();
    let raycaster = new THREE.Raycaster()

    controls.enabled = true;

    let select = (o,sel)=>{
        if (!sel) {
            if (o.userData.unselectedMaterial) {
                o.material = o.userData.unselectedMaterial
                o.userData.unselectedMaterial = null
            }
            world.select(o, false)
        } else {
            o.userData.unselectedMaterial = o.material
            o.material = o.material.clone()
            //o.material.wireframe = true;
            //o.material.blending = THREE.AdditiveBlending;
            o.material.emissive.set(0xff0000);
            world.select(o, true)
        }
    }

    window.addEventListener("keyup", e=>(!e.ctrlKey) && (controls.enabled = true))
    window.addEventListener("keydown", e=>(e.ctrlKey) && (controls.enabled = false))
    let buttons;
    let dragStart = cx.clone();
    let dragEnd = cx.clone();
    let dragDelta = cx.clone();
    let dragProxy
    let dragObject

    world = new World(scene)

    core = {
        renderer,
        scene,
        world
    }

    skyEnv = new SkyEnv(core)

    world.defcmd('info', (p)=>info.message(p[1]))
    world.defcmd('chat', (p)=>info.chat(p[1]))

    let dlt = new THREE.Vector3()
    world.defcmd('tp', (p)=>{
        dlt.set(p[1] | 0, 0, p[2] | 0)
        info.chat(dlt.x, dlt.z)
        dlt.sub(controls.target)
        controls.target.add(dlt)
        camera.position.add(dlt)

    }
    )

    let dragPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(world.gridSize * 2,world.gridSize * 2,2,2),new THREE.MeshBasicMaterial({
        opacity: .5,
        transparent: true,
        //depthTest: false
        depthWrite: true
    }))
    dragPlane.position.y = .1
    dragPlane.rotation.x = Math.PI * -.5

    let raycast = (e,grp,recursive=true)=>{

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera)
        return raycaster.intersectObjects(grp, recursive);
    }
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
    let updateDrag = ()=>{

        if (dragEvt && buttons) {
            const intersects = raycast(dragEvt, [dragPlane], false);
            for (let i = 0; i < intersects.length; i++) {
                dragEnd.copy(intersects[0].point)
                moveSelectionPlane(dragEnd)
                break
            }
        }
    }
    let vmove = new THREE.Vector3()
    let inChat
    let chatBuf = ''
    let kvalid = (keycode)=>(keycode > 47 && keycode < 58) || // number keys
    keycode == 32 || keycode == 13 || // spacebar & return key(s) (if you want to allow carriage returns)
    (keycode > 64 && keycode < 91) || // letter keys
    (keycode > 95 && keycode < 112) || // numpad keys
    (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
    (keycode > 218 && keycode < 223);
    // [\]' (in order)

    window.addEventListener("keydown", function(e) {
        if (e.code == 'NumpadAdd')
            moveSelected(vmove.set(0, gridSz, 0))
        if (e.code == 'NumpadSubtract')
            moveSelected(vmove.set(0, -gridSz, 0))

        if (e.code == 'Enter') {
            if (inChat) {
                if (chatBuf.length) {
                    info.chatHistory(chatBuf)
                    info.chat('_')
                    if (chatBuf.indexOf('/') == 0) {
                        world.docmd(...(chatBuf.slice(1).split(' ')))
                    }
                } else {
                    inChat = false
                    info.chat('')
                }
            } else {
                inChat = true
                info.chat('_')
            }
            chatBuf = ''
        } else {
            if (inChat) {
                let valid = kvalid(e.keyCode)
                if (valid) {
                    chatBuf = chatBuf + e.key
                    info.chat(chatBuf + '_')
                } else if (e.code == 'Backspace') {
                    if (chatBuf.length) {
                        chatBuf = chatBuf.slice(0, -1)
                        info.chat(chatBuf + '_')
                    }
                }
            }

        }
    })
    window.addEventListener("keyup", function(e) {})
    window.addEventListener("mousemove", function(e) {
        dragEvt = e
    })

    let vtfm = (v,f)=>v.set(f(v.x), f(v.y), f(v.z))

    window.addEventListener("mouseup", function(e) {

        if (dragProxy && dragObject) {
            scene.attach(dragProxy)
            //       dragObject.position.copy(dragProxy.position)

            dragDelta.copy(dragEnd).sub(dragStart)

            if (e.ctrlKey && e.altKey && e.shiftKey) {
                let nsel = world.selection.map(v=>world.cloneObject(v))
                while (world.selection.length)
                    select(world.selection[0].view, false)

                nsel.forEach(obj=>(obj = world.objects[obj.userData.objectId]) && world.addToSector(obj, obj.sector))
                nsel.forEach(e=>world.select(e, true))
            }

            world.selection.forEach(v=>world.move(v, dragDelta))

            //            world.move(dragObject,dragDelta)

            // dragObject.view 
            dragPlane.parent && scene.remove(dragPlane)
            dragProxy.parent.remove(dragProxy)
            dragProxy = undefined
            buttons = e.buttons
        }
    })
    window.addEventListener("mousedown", function(e) {
        buttons = e.buttons
        let intersects = raycast(e, scene.children)
        if (!e.shiftKey)
            while (world.selection.length)
                select(world.selection[0].view, false)
        for (let i = 0; i < intersects.length; i++) {
            let o = intersects[i].object
            dragObject = world.objects[o.userData.objectId];
            if (!dragObject)
                break;
            if (dragObject.flags & 1) {
                continue;
            }
            if (o.material.color) {
                select(o, true)
            }
            dragStart.copy(intersects[i].point)
            dragEnd.copy(dragStart)
            dragPlane.position.copy(dragStart)
            scene.add(dragPlane)
            dragProxy = o.clone()

            o.parent.add(dragProxy)

            dragPlane.attach(dragProxy)

            break;
            //Only process first hit
        }
    });

    world.targetSectorChanged = (nsec)=>{
        skyEnv.targetChanged(nsec.position)
        info.display(`${nsec.coordinate.x},${nsec.coordinate.z}:${world.dynamics.length}`)
    }

    //let tex = new THREE.TextureLoader().load("https://cdn.glitch.com/8c6a200d-6243-4e2a-b5c9-d6846ac00d17%2FYSB_60S_812_750x.png?v=1585936092913");
    //ProcGen(scene)
    document.dispatchEvent(new CustomEvent('init-app',{
        detail: {
            world
        }
    }))

    scene.add(camera);

    function onWindowResize(event) {
        let width = window.innerWidth;
        let height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function animate() {
        world && world.update(controls.target)

        requestAnimationFrame(animate);
        skyChanged && skyChanged();
        updateDrag()

        updateCamMove()
        render();
    }

    function render() {
        let time = performance.now() / 1000;
        controls.update();

        camera.position.y += -controls.target.y;
        controls.target.y = 0

        info.update(time)

        //skyEnv&&skyEnv.update()
        renderer.render(scene, camera);
    }
    animate();
    return {
        camera,
        scene,
        renderer,
        controls,
        clock,
        skyEnv,
        world,
        info
    }
}
