import*as THREE from "https://threejs.org/build/three.module.js";
//import {OrbitControls} from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import {GLTFLoader} from "https://threejs.org/examples/jsm/loaders/GLTFLoader.js";
import {DRACOLoader} from "https://threejs.org/examples/jsm/loaders/DRACOLoader.js";
import {RGBELoader} from "https://threejs.org/examples/jsm/loaders/RGBELoader.js";
import SkyEnv from "./components/SkyEnv.js"
import World from "../World.js"
import ProcGen from "../math/ProcGen.js"

import Info from "../Info.js"
import Editor from "../Editor.js"
import PostProcessing from "./PostProcessing.js"
import PostUI from "./PostUI.js"
import PostFX from "./PostFX.js"
import {CameraControls} from "./camera/CameraControls.js"
import AudioManager from "./AudioManager.js"

let cfg={}

let initializer = new Promise((resolve,reject)=>{
    let self;

    let  scene, renderer, controls;//camera,
    let clock;

    let skyEnv;
    let world;

    let info = new Info(THREE);

    let skyChanged

    let {min, max, abs, PI, floor} = Math;

    const gltfLoader = new GLTFLoader()
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://threejs.org/examples/js/libs/draco/');
    gltfLoader.setDRACOLoader(dracoLoader);

    let core = {}

    let aspect = window.innerWidth / window.innerHeight;
    



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
    renderer.toneMappingExposure = .5;

    //renderer.toneMappingExposure = .25;
    renderer.outputEncoding = THREE.sRGBEncoding

    renderer.setClearColor("black", 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

/*
    camera = new THREE.PerspectiveCamera(90,window.innerWidth / window.innerHeight,0.1,10000);
    let csz = 640
    //camera = new THREE.OrthographicCamera(-csz,csz,csz,-csz,-1000,1000);
    camera.position.copy({
        x: -0.7965422346052364,
        y: 1.656460008711307,
        z: -0.8481421792924781
    });
    camera.position.set(10, 10, 10);
*/

    let cameraControls = new CameraControls({scene,renderer})

    //camera = cameraControls.multiCamera.camera;
    
    controls = cameraControls.orbitControls;


    let audioManager = new AudioManager( THREE )



    clock = new THREE.Clock();

    onWindowResize();
    window.addEventListener("resize", onWindowResize, false);


    world = new World(scene)

    core = {
        THREE,
        scene,
        renderer,
        world,
        RGBELoader,
        //camera,
        controls,
    }

    let pushCameraBehavior = cameraControls.pushCameraBehavior;
    pushCameraBehavior.enabled = false;

    let rslv=(se)=>{
        skyEnv = se;

        self = {
            THREE,
            gltfLoader,
            //camera,
            cameraControls,
            scene,
            renderer,
            controls,
            clock,
            skyEnv,
            world,
            info,
            pushCameraBehavior,
        }

        resolve(self)
    }


    if(cfg.sky!=='false'){ new SkyEnv(core).then(
        rslv
    )}else rslv()



    world.defcmd('spin', (p)=>controls.autoRotate = !controls.autoRotate)
    world.defcmd('info', (p)=>info.message(p[1]))
    world.defcmd('chat', (p)=>info.chat(p[1]))

    let dlt = new THREE.Vector3()
    world.defcmd('tp', (p)=>{
        dlt.set(p[1] | 0, 0, p[2] | 0)
        info.chat(dlt.x, dlt.z)
        dlt.sub(controls.target)
        controls.target.add(dlt)
        cameraControls.camera.position.add(dlt)

    }
    )


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
        if (e.code == 'Tab') {
            world.docmd('starmap')
        }else
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

let sectorEnteredEvent = new Event('sector_entered',{detail:0})
    world.targetSectorChanged = (nsec)=>{
        sectorEnteredEvent.detail = nsec;
        document.dispatchEvent(sectorEnteredEvent)

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

    //scene.add(camera);

    let editor = new Editor({
        THREE,
        world,
        renderer,
        scene,
        controls,
        cameraControls,
        //camera
    })


    function onWindowResize(event) {
        let width = window.innerWidth;
        let height = window.innerHeight;
        cameraControls.multiCamera.setSize(width,height)
        renderer.setSize(width, height);
    }

audioManager.load('./assets/blerzat.mp3', 'intro')

audioManager.play('intro')

    function animate() {

        requestAnimationFrame(animate);
        
        world && world.update(controls.target)

        skyChanged && skyChanged();

        editor.update()
        
        audioManager.update(cameraControls.camera)
        
        render();
    }

    let beforeRenderEvent = new CustomEvent('before-render')
    let afterRenderEvent = new CustomEvent('after-render')


    let postProcessing = new PostProcessing({
        THREE,
        renderer,
        scene,
        camera: {
            current: cameraControls.multiCamera.camera
        }
    })

    let postUI = new PostUI(THREE,postProcessing);
    let postFX = new PostFX(THREE,postProcessing);
    
    document.dispatchEvent(new CustomEvent('glCreated'))
    postProcessing.enabled = true;
    postProcessing.cutToBlack();
    postProcessing.blurWorld(true)
postProcessing.setPassActivation('unrealBloom',true)
    setTimeout(()=>{
        postProcessing.cutToBlack(true)
        postProcessing.blurWorld(false, ()=>{
            postProcessing.setPassActivation('unrealBloom',true)
            //postProcessing.setPass
            postProcessing.enabled = false;//false;
        }
        , 250)
    }
    , 250)

world.defcmd('cameraType',(p)=>{
    console.log(p[1])
    cameraControls.cameraType = p[1];
    //camera = cameraControls.getCamera();
})
    function render() {
        let time = performance.now() / 1000;
        cameraControls.update();

        info.update(time)

        //skyEnv&&skyEnv.update()

        document.dispatchEvent(beforeRenderEvent);

        if (postProcessing.enabled)
            postProcessing.render()
        else
            renderer.render(scene, cameraControls.camera);
        document.dispatchEvent(afterRenderEvent);
    }
    
    animate();
}
)

/**
 * @constructor
 * @param {object} _cfg
 */
function Renderer(_cfg) {
    cfg=_cfg;
    return initializer;
}


export default Renderer;
