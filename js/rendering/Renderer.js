import*as THREE from "https://threejs.org/build/three.module.js";
//import {OrbitControls} from "https://threejs.org/examples/jsm/controls/OrbitControls.js";
import {SVGLoader} from "https://threejs.org/examples/jsm/loaders/SVGLoader.js";
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
import AudioManager from "./AudioManager.js"
import Network from "./components/Network.js"
let beforeRenderEvent = new CustomEvent('before-render',{
    detail: {
        dts: 0
    }
})
let justBeforeRenderEvent = new CustomEvent('just-before-render',{
    detail: {
        dts: 0
    }
})
let updateControlsEvent = new CustomEvent('update-controls',{
    detail: {
        dts: 0
    }
})
let afterRenderEvent = new CustomEvent('after-render')
let simTickEvent = new CustomEvent('sim-tick')

import {Cameras} from "./camera/Cameras.js"

let cfg = {}

let initializer = new Promise((resolve,reject)=>{
    let self;

    let skyEnv;
    let world;

    let info = new Info(THREE);

    let skyChanged

    let {min, max, abs, PI, floor} = Math;

    const svgLoader = new SVGLoader()
    const gltfLoader = new GLTFLoader()
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://threejs.org/examples/js/libs/draco/');
    gltfLoader.setDRACOLoader(dracoLoader);

    let core = {}

    let scene, renderer, controls;
    //camera,
    let clock;

    let aspect = window.innerWidth / window.innerHeight;

    scene = new THREE.Scene();

    scene.fog = new THREE.Fog(new THREE.Color(0xdee8f1),80,190);

    let rcfg = {
        antialias: true,
        //alpha: true,
        //logarithmicDepthBuffer:true

    }
    if (cfg.canvas)
        rcfg.canvas = canvas;
    renderer = new THREE.WebGLRenderer(rcfg);

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
    //renderer.domElement.style.width=
    renderer.domElement.style.position='absolute'
    renderer.domElement.style.width='100%'
    renderer.domElement.style.height='100%'
//renderer.domElement.style.aspectRatio = 'auto'
    renderer.setClearColor("black", 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    document.body.style.margin = '0px'
    //document.body.style.width =
    //document.body.style.height = '100%'
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

    let cameras = new Cameras({
        THREE,
        scene,
        renderer
    })

    //camera = cameraControls.multiCamera.camera;

    controls = cameras.orbitControls;

    let audioManager;
    // = new AudioManager( THREE )

    clock = new THREE.Clock();

    resize();
    //window.addEventListener("resize", resize, false);

    world = new World(scene)

    core = {
        THREE,
        scene,
        renderer,
        world,
        RGBELoader,
        //camera,
        controls,
        GLTFLoader,
    }

    let rendererPaused = false;

    let pauseRenderer = (paused)=>{
        rendererPaused = paused
    }
    let rslv = (se)=>{
        skyEnv = se;

        self = {
            THREE,
            gltfLoader,
            svgLoader,
            //camera,
            editor,
            cameras,
            scene,
            renderer,
            controls,
            clock,
            skyEnv,
            world,
            info,
            pauseRenderer
        }

        resolve(self)
    }

    if (cfg.sky !== 'false') {
        new SkyEnv(core).then(rslv)
    } else
        rslv()

    world.defcmd('spin', (p)=>controls.autoRotate = !controls.autoRotate)
    world.defcmd('info', (p)=>info.message(p[1]))
    world.defcmd('chat', (p)=>info.chat(p[1]))

    let dlt = new THREE.Vector3()
    world.defcmd('tp', (p)=>{
        dlt.set(p[1] | 0, 0, p[2] | 0)
        info.chat(dlt.x, dlt.z)
        dlt.sub(controls.target)
        controls.target.add(dlt)
        cameras.current.position.add(dlt)

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
        } else if (e.code == 'Enter') {
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
    // window.addEventListener("keyup", function(e) {})

    let sectorEnteredEvent = new Event('sector_entered',{
        detail: 0
    })
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

    let editor = core.editor = new Editor({
        THREE,
        world,
        renderer,
        scene,
        controls,
        cameras,
        //camera
    })
    editor.raycastTargets = scene.children;
    editor.raycastRecursive = false;

    let {Matrix4, Ray, Sphere} = THREE;
    const _inverseMatrix$2 = /*@__PURE__*/
    new Matrix4();
    const _ray$2 = /*@__PURE__*/
    new Ray();
    const _sphere$3 = /*@__PURE__*/
    new Sphere();

    function raycastBox(raycaster, intersects) {

        const geometry = this.geometry;
        const material = this.material;
        const matrixWorld = this.matrixWorld;

        if (material === undefined)
            return;

        // Checking boundingSphere distance to ray

        if (geometry.boundingSphere === null)
            geometry.computeBoundingSphere();

        _sphere$3.copy(geometry.boundingSphere);
        _sphere$3.applyMatrix4(matrixWorld);

        if (raycaster.ray.intersectsSphere(_sphere$3) === false)
            return;

        //

        _inverseMatrix$2.copy(matrixWorld).invert();
        _ray$2.copy(raycaster.ray).applyMatrix4(_inverseMatrix$2);

        // Check boundingBox before continuing

        if (geometry.boundingBox !== null) {

            if (_ray$2.intersectsBox(geometry.boundingBox) === false)
                return;

        }
    }

    function resize() {
        let width = renderer.domElement.clientWidth;//window.innerWidth;
        let height = renderer.domElement.clientHeight;//window.innerHeight;
        if((renderer.domElement.width!==width)||(renderer.domElement.height!==height)){
			cameras.setSize(width, height)
			renderer.setSize(width, height, false);
			document.dispatchEvent(new CustomEvent('renderer-resized',{
				detail: {
					width,
					height
				}
			}))
        }
    }

    audioManager && audioManager.load('./assets/blerzat.mp3', 'intro')

    audioManager && audioManager.play('intro')

    let travTime;
    document.addEventListener('object-clicked', (dob)=>{

        console.log("Object clicked:", travTime, editor.raycastTime);
    }
    );
    let meshes = []

    function animate() {

        //requestAnimationFrame(animate);
        resize()

        world && world.update(cameras.current.position);
        //controls.target)

        skyChanged && skyChanged();

        editor.update()

        audioManager && audioManager.update(rig)

        travTime = performance.now()

        meshes.length = 0;
        scene.traverse(e=>e.isMesh && meshes.push(e))
        editor.raycastTargets = meshes;
        travTime = performance.now() - travTime;

        render();
    }

    let postProcessing = new PostProcessing({
        THREE,
        renderer,
        scene,
        camera: cameras
    })

    let postUI = new PostUI(THREE,postProcessing);
    let postFX = new PostFX(THREE,postProcessing);

    postProcessing.postUI = postUI;

    document.dispatchEvent(new CustomEvent('glCreated'))
    postProcessing.enabled = true;
    postProcessing.cutToBlack();
    postProcessing.blurWorld(true)
    postProcessing.setPassActivation('unrealBloom', true)

    postProcessing.cutToBlack(true)
    setTimeout(()=>{
        postProcessing.cutToBlack(true)
        postProcessing.blurWorld(false, ()=>{
            postProcessing.setPassActivation('unrealBloom', true)
            //postProcessing.setPass
            postProcessing.enabled = false;
            //false;
        }
        , 250)
    }
    , 250)

    world.defcmd('cameraType', (p)=>{
        console.log(p[1])
        cameras.cameraType = p[1];
        //camera = cameraControls.getCamera();
    }
    )

    let depthPrepass = new THREE.MeshStandardMaterial({
        colorWrite: false,
        depthWrite: true,
    });

    let simTime = 0;
    let lastTime = performance.now() / 1000;
    let simTimeSlice = 1 / 60;
    let dt;
    let simAccum = 0;
    function render() {
        if (rendererPaused)
            return;
        let time = performance.now() / 1000;
        cameras.update();

        info.update(time)

        dt = time - lastTime;
        simAccum += dt;
        while (simAccum >= simTimeSlice) {
            simAccum -= simTimeSlice;
            document.dispatchEvent(simTickEvent);
            if (simAccum > (simTimeSlice * 10))
                simAccum = 0;
        }
        lastTime = time;

        //skyEnv&&skyEnv.update()
        updateControlsEvent.detail.dts = dt;
        document.dispatchEvent(updateControlsEvent);

        //skyEnv&&skyEnv.update()
        beforeRenderEvent.detail.dts = dt;
        document.dispatchEvent(beforeRenderEvent);

        //skyEnv&&skyEnv.update()
        justBeforeRenderEvent.detail.dts = dt;
        document.dispatchEvent(justBeforeRenderEvent);

        if (postProcessing.enabled)
            postProcessing.render()
        else {

            if (self && self.depthPrepassEnabled) {
                scene.overrideMaterial = depthPrepass;
                renderer.render(scene, cameras.current);
                renderer.autoClear = renderer.autoClearColor = renderer.autoClearDepth = renderer.autoClearStencil = false;
                scene.overrideMaterial = null;
                renderer.render(scene, cameras.current);
                renderer.autoClear = renderer.autoClearColor = renderer.autoClearDepth = renderer.autoClearStencil = true;
            } else {
                renderer.render(scene, cameras.current);
            }

        }
        document.dispatchEvent(afterRenderEvent);
    }
    renderer.setAnimationLoop(animate);
}
)

/**
 * @constructor
 * @param {object} _cfg
 */
function Renderer(_cfg) {
    cfg = _cfg;
    return initializer;
}

export default Renderer;

Renderer.injectCSS = (css)=>{

    css = css || `
body {
	margin: 0;
	background-color: #000;
	color: #fff;
	font-family: Monospace;
	font-size: 13px;
	line-height: 24px;
	overscroll-behavior: none;
}

a {
	color: #ff0;
	text-decoration: none;
}

a:hover {
	text-decoration: underline;
}

button {
	cursor: pointer;
	text-transform: uppercase;
}

#info {
	position: absolute;
	top: 0px;
	width: 100%;
	padding: 10px;
	box-sizing: border-box;
	text-align: center;
	-moz-user-select: none;
	-webkit-user-select: none;
	-ms-user-select: none;
	user-select: none;
	pointer-events: none;
	z-index: 1; /* TODO Solve this in HTML */
}

a, button, input, select {
	pointer-events: auto;
}

.dg.ac {
	-moz-user-select: none;
	-webkit-user-select: none;
	-ms-user-select: none;
	user-select: none;
	z-index: 2 !important; /* TODO Solve this in HTML */
}

#overlay {
	position: absolute;
	font-size: 16px;
	z-index: 2;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	background: rgba(0,0,0,0.7);
}

#overlay button {
	background: transparent;
	border: 0;
	border: 1px solid rgb(255, 255, 255);
	border-radius: 4px;
	color: #ffffff;
	padding: 12px 18px;
	text-transform: uppercase;
	cursor: pointer;
}

#notSupported {
	width: 50%;
	margin: auto;
	background-color: #f00;
	margin-top: 20px;
	padding: 10px;
}
`
    var linkElement = document.createElement('link');
    linkElement.setAttribute('rel', 'stylesheet');
    linkElement.setAttribute('type', 'text/css');
    linkElement.setAttribute('href', 'data:text/css;charset=UTF-8,' + encodeURIComponent(css));
    document.head.appendChild(linkElement)
}
